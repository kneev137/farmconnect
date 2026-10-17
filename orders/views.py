from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, permissions, generics, status, exceptions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Cart, CartItem, Order, Delivery, Payment
from .serializers import (
    CartSerializer, CartItemSerializer, OrderSerializer, CheckoutSerializer,
    DeliverySerializer, DeliveryStatusUpdateSerializer, PaymentSerializer
)
from accounts.permissions import IsConsumer, IsFarmer
from accounts.models import Consumer
from products.models import Inventory


class CartView(generics.RetrieveAPIView):
    """Retrieves the active shopping cart for the logged-in user."""
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        consumer, _ = Consumer.objects.get_or_create(user=self.request.user)
        cart, _ = Cart.objects.get_or_create(consumer=consumer)
        return cart


class CartItemViewSet(viewsets.ModelViewSet):
    """Manages individual items inside the user's shopping cart."""
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        consumer, _ = Consumer.objects.get_or_create(user=self.request.user)
        return CartItem.objects.filter(
            cart__consumer=consumer
        ).select_related('product', 'product__farm', 'product__inventory')

    def perform_create(self, serializer):
        consumer, _ = Consumer.objects.get_or_create(user=self.request.user)
        cart, _ = Cart.objects.get_or_create(consumer=consumer)
        product = serializer.validated_data['product']
        quantity = serializer.validated_data['quantity']

        # If product already in cart, increment quantity rather than creating duplicate
        existing_item = CartItem.objects.filter(cart=cart, product=product).first()
        if existing_item:
            new_qty = existing_item.quantity + quantity
            available = product.inventory.quantity_available if hasattr(product, 'inventory') else 0
            if new_qty > available:
                raise exceptions.ValidationError(
                    f"Adding {quantity} exceeds available stock ({available} {product.unit} total available)."
                )
            existing_item.quantity = new_qty
            existing_item.save()
            serializer.instance = existing_item
        else:
            serializer.save(cart=cart)


class CartClearView(generics.GenericAPIView):
    """Empties all items from the user's shopping cart."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        consumer, _ = Consumer.objects.get_or_create(user=request.user)
        cart, _ = Cart.objects.get_or_create(consumer=consumer)
        count = cart.items.count()
        cart.items.all().delete()
        return Response({"detail": f"Cleared {count} item(s) from your cart."}, status=status.HTTP_200_OK)


class CheckoutView(generics.CreateAPIView):
    """Converts the user's active cart into an Order using atomic locking."""
    serializer_class = CheckoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order, context={'request': request}).data, status=status.HTTP_201_CREATED)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """Allows users to view their order history and track fulfillment status."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        consumer, _ = Consumer.objects.get_or_create(user=self.request.user)
        return Order.objects.filter(
            consumer=consumer
        ).prefetch_related(
            'items__product__farm', 'payment', 'delivery'
        ).order_by('-placed_at')


    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_order(self, request, pk=None):
        """Cancels an order if not yet shipped and restores stock atomically."""
        order = self.get_object()
        if order.status in ['shipped', 'delivered', 'cancelled']:
            return Response(
                {"detail": f"Cannot cancel an order with status '{order.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Lock inventories and restore stock
            for item in order.items.select_related('product').all():
                if item.product and hasattr(item.product, 'inventory'):
                    inventory = Inventory.objects.select_for_update().get(product=item.product)
                    inventory.quantity_available += item.quantity
                    inventory.save()

            order.status = 'cancelled'
            order.save()

            if hasattr(order, 'payment'):
                order.payment.status = 'refunded' if order.payment.status == 'completed' else 'failed'
                order.payment.save()

            if hasattr(order, 'delivery'):
                order.delivery.status = 'failed'
                order.delivery.save()

        return Response(
            {"detail": "Order cancelled successfully and inventory restored.", "status": order.status},
            status=status.HTTP_200_OK
        )


class FarmerOrdersView(generics.ListAPIView):
    """Lists orders containing at least one product from the authenticated farmer."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def get_queryset(self):
        farmer = self.request.user.farmer_profile
        return Order.objects.filter(
            items__product__farm__farmer=farmer
        ).distinct().prefetch_related(
            'items__product__farm', 'payment', 'delivery', 'consumer__user'
        ).order_by('-placed_at')


class UpdateDeliveryStatusView(generics.UpdateAPIView):
    """Allows a farmer or admin to update the delivery status of an order."""
    serializer_class = DeliveryStatusUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.role == 'admin':
            return Delivery.objects.all()
        return Delivery.objects.filter(
            order__items__product__farm__farmer__user=self.request.user
        ).distinct()

    def perform_update(self, serializer):
        delivery = serializer.save()
        order = delivery.order

        if delivery.status == 'delivered':
            if not delivery.delivered_at:
                delivery.delivered_at = timezone.now()
                delivery.save()
            order.status = 'delivered'
            order.save()
        elif delivery.status == 'out_for_delivery':
            order.status = 'shipped'
            order.save()
        elif delivery.status == 'failed':
            order.status = 'cancelled'
            order.save()


class SimulatePaymentView(generics.GenericAPIView):
    """Simulates payment gateway completion for card/UPI payments."""
    permission_classes = [permissions.IsAuthenticated, IsConsumer]
    serializer_class = PaymentSerializer

    def post(self, request, pk=None, *args, **kwargs):
        try:
            payment = Payment.objects.select_related('order').get(
                id=pk,
                order__consumer=request.user.consumer_profile
            )
        except Payment.DoesNotExist:
            return Response({"detail": "Payment record not found."}, status=status.HTTP_404_NOT_FOUND)

        if payment.status == 'completed':
            return Response({"detail": "Payment has already been completed."}, status=status.HTTP_400_BAD_REQUEST)

        payment.status = 'completed'
        payment.paid_at = timezone.now()
        payment.save()

        order = payment.order
        if order.status == 'pending':
            order.status = 'confirmed'
            order.save()

        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)