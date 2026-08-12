from django.db import models

# Create your models here.
from django.db import models
from products.models import Product
from accounts.models import Consumer


class Review(models.Model):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    consumer = models.ForeignKey(Consumer, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'consumer')

    def __str__(self):
        return f"{self.rating}★ - {self.product.name} by {self.consumer.user.username}"