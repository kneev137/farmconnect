from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem, Payment, Delivery
from products.models import Product, Inventory
from products.serializers import ProductSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    unit = serializers.CharField(source='product.unit', read_only=True)
    price_per_unit = serializers.DecimalField(source='product.price_per_unit', max_digits=8, decimal_places=2, read_only=True)
    item_total = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_name', 'product_image', 'unit', 'price_per_unit', 'quantity', 'item_total', 'added_at']
        read_only_fields = ['id', 'added_at']

    def get_item_total(self, obj):
        if obj.product:
            return round(obj.quantity * obj.product.price_per_unit, 2)
        return 0

    def get_product_image(self, obj):
        if obj.product and obj.product.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return None

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value

    def validate(self, data):
        product = data.get('product') or (self.instance.product if self.instance else None)
        quantity = data.get('quantity')

        if not product:
            raise serializers.ValidationError("Valid product is required.")

        if not product.is_active:
            raise serializers.ValidationError(f"Product '{product.name}' is currently unavailable.")

        try:
            available = product.inventory.quantity_available
        except Inventory.DoesNotExist:
            available = 0

        if quantity > available:
            raise serializers.ValidationError(
                f"Only {available} {product.unit} of '{product.name}' currently available in stock."
            )
        return data


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'consumer', 'total_items', 'grand_total', 'items', 'created_at']
        read_only_fields = ['id', 'consumer', 'created_at']

    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def get_grand_total(self, obj):
        return round(sum(item.quantity * item.product.price_per_unit for item in obj.items.all()), 2)


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    unit = serializers.CharField(source='product.unit', read_only=True)
    farm_name = serializers.CharField(source='product.farm.name', read_only=True)
    item_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'unit', 'farm_name', 'quantity', 'price_at_purchase', 'item_total']
        read_only_fields = ['id']

    def get_item_total(self, obj):
        return round(obj.quantity * obj.price_at_purchase, 2)


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'method', 'status', 'amount', 'paid_at']
        read_only_fields = ['id', 'status', 'amount', 'paid_at']


class DeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = ['id', 'address', 'status', 'estimated_date', 'delivered_at']
        read_only_fields = ['id', 'delivered_at']


class DeliveryStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = ['status', 'estimated_date']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    delivery = DeliverySerializer(read_only=True)
    consumer_name = serializers.CharField(source='consumer.user.username', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'consumer', 'consumer_name', 'status', 'total_amount',
            'placed_at', 'items', 'payment', 'delivery'
        ]
        read_only_fields = ['id', 'consumer', 'status', 'total_amount', 'placed_at']


class CheckoutSerializer(serializers.Serializer):
    address = serializers.CharField(required=True, allow_blank=False)
    payment_method = serializers.ChoiceField(choices=Payment.METHOD_CHOICES, default='card')

    def create(self, validated_data):
        request = self.context['request']
        if not hasattr(request.user, 'consumer_profile'):
            raise serializers.ValidationError("Only consumers can perform checkout.")

        consumer = request.user.consumer_profile
        try:
            cart = Cart.objects.get(consumer=consumer)
        except Cart.DoesNotExist:
            raise serializers.ValidationError("Cart not found.")

        items = list(cart.items.select_related('product').all())
        if not items:
            raise serializers.ValidationError("Cannot checkout with an empty cart.")

        with transaction.atomic():
            # Lock inventories for items being ordered to prevent overselling race conditions
            product_ids = [item.product_id for item in items]
            inventories = {
                inv.product_id: inv
                for inv in Inventory.objects.select_for_update().filter(product_id__in=product_ids)
            }

            # Validate stock under lock
            for item in items:
                inventory = inventories.get(item.product_id)
                if not inventory or item.quantity > inventory.quantity_available:
                    available = inventory.quantity_available if inventory else 0
                    raise serializers.ValidationError(
                        f"Insufficient stock for '{item.product.name}'. Only {available} {item.product.unit} available."
                    )

            # Compute server-verified total
            total = sum(item.quantity * item.product.price_per_unit for item in items)

            # Deduct inventory stock
            for item in items:
                inventory = inventories[item.product_id]
                inventory.quantity_available -= item.quantity
                inventory.save()

            # Create Order, OrderItems, Payment, Delivery
            order = Order.objects.create(
                consumer=consumer,
                total_amount=total,
                status='pending'
            )

            for item in items:
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
                status='completed' if validated_data['payment_method'] == 'cod' else 'pending',
                paid_at=timezone.now() if validated_data['payment_method'] == 'cod' else None
            )

            Delivery.objects.create(
                order=order,
                address=validated_data['address'],
                status='preparing',
            )

            # Clear cart items after successful checkout
            cart.items.all().delete()

            # Update consumer default delivery address if currently empty
            if not consumer.default_delivery_address:
                consumer.default_delivery_address = validated_data['address']
                consumer.save()

            return order