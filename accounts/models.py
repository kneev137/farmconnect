from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ('consumer', 'Consumer'),
        ('farmer', 'Farmer'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='consumer')
    phone_number = models.CharField(max_length=15, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username


class Consumer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='consumer_profile')
    default_delivery_address = models.TextField(blank=True)

    def __str__(self):
        return self.user.username