from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings
from products.models import Product


class Cart(models.Model):
    consumer = models.OneToOneField('accounts.Consumer', on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cart - {self.consumer.user.username}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=3)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cart', 'product')
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gt=0),
                name='chk_cartitem_quantity_positive'
            )
        ]

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"


class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )
    consumer = models.ForeignKey('accounts.Consumer', on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    placed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(total_amount__gte=0),
                name='chk_order_total_non_negative'
            )
        ]

    def __str__(self):
        return f"Order #{self.id} - {self.consumer.user.username}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=3)
    price_at_purchase = models.DecimalField(max_digits=8, decimal_places=2, help_text="Snapshot of price when ordered")

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gt=0),
                name='chk_orderitem_quantity_positive'
            ),
            models.CheckConstraint(
                condition=models.Q(price_at_purchase__gt=0),
                name='chk_orderitem_price_positive'
            )
        ]

    def __str__(self):
        return f"{self.quantity} x {self.product} (Order #{self.order_id})"


class Payment(models.Model):
    METHOD_CHOICES = (
        ('card', 'Card'),
        ('upi', 'UPI'),
        ('cod', 'Cash on Delivery'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    method = models.CharField(max_length=10, choices=METHOD_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gte=0),
                name='chk_payment_amount_non_negative'
            )
        ]

    def __str__(self):
        return f"Payment for Order #{self.order_id} - {self.status}"



class Delivery(models.Model):
    STATUS_CHOICES = (
        ('preparing', 'Preparing'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    )
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery')
    address = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='preparing')
    estimated_date = models.DateField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Delivery for Order #{self.order_id} - {self.status}"


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=20, null=True, blank=True)
    new_status = models.CharField(max_length=20)
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = 'Order Status Histories'
        ordering = ['-changed_at']

    def __str__(self):
        return f"Order #{self.order_id}: {self.old_status} -> {self.new_status} at {self.changed_at}"