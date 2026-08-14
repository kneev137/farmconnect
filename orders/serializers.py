from rest_framework import serializers
from django.db import transaction
from .models import Cart, CartItem, Order, OrderItem, Payment, Delivery
from products.models import Product


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    price_per_unit = serializers.DecimalField(source='product.price_per_unit', max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_name', 'price_per_unit', 'quantity', 'added_at']
        read_only_fields = ['id', 'added_at']

    def validate(self, data):
        product = data.get('product') or self.instance.product
        quantity = data.get('quantity')
        available = product.inventory.quantity_available
        if quantity > available:
            raise serializers.ValidationError(f"Only {available} {product.unit} available.")
        return data


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'consumer', 'items', 'total', 'created_at']
        read_only_fields = ['id', 'consumer', 'created_at']

    def get_total(self, obj):
        return sum(item.quantity * item.product.price_per_unit for item in obj.items.all())


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price_at_purchase']
        read_only_fields = ['id']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'method', 'status', 'amount', 'paid_at']
        read_only_fields = ['id', 'status', 'amount', 'paid_at']


class DeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = ['id', 'address', 'status', 'estimated_date', 'delivered_at']
        read_only_fields = ['id', 'status', 'delivered_at']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    delivery = DeliverySerializer(read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'consumer', 'status', 'total_amount', 'placed_at', 'items', 'payment', 'delivery']
        read_only_fields = ['id', 'consumer', 'status', 'total_amount', 'placed_at']


class CheckoutSerializer(serializers.Serializer):
    """Takes a delivery address + payment method, turns the current cart into an Order."""
    address = serializers.CharField()
    payment_method = serializers.ChoiceField(choices=Payment.METHOD_CHOICES)

    def create(self, validated_data):
        request = self.context['request']
        consumer = request.user.consumer_profile
        cart = Cart.objects.get(consumer=consumer)
        items = cart.items.select_related('product', 'product__inventory').all()

        if not items:
            raise serializers.ValidationError("Cart is empty.")

        with transaction.atomic():
            total = sum(item.quantity * item.product.price_per_unit for item in items)
            order = Order.objects.create(consumer=consumer, total_amount=total, status='pending')

            for item in items:
                inventory = item.product.inventory
                if item.quantity > inventory.quantity_available:
                    raise serializers.ValidationError(f"Not enough stock for {item.product.name}.")
                inventory.quantity_available -= item.quantity
                inventory.save()

                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    price_at_purchase=item.product.price_per_unit,
                )

            Payment.objects.create(
                order=order,
                method=validated_data['payment_method'],
                amount=total,
                status='pending',
            )
            Delivery.objects.create(
                order=order,
                address=validated_data['address'],
                status='preparing',
            )

            cart.items.all().delete()

        return order