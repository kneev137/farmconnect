from django.db import models

# Create your models here.
from django.db import models
from accounts.models import User


class Farmer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='farmer_profile')
    farm_name = models.CharField(max_length=150)
    bio = models.TextField(blank=True, help_text="Farmer's story, shown to consumers")
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.farm_name

class Farm(models.Model):
    farmer = models.ForeignKey(Farmer, on_delete=models.CASCADE, related_name='farms')
    name = models.CharField(max_length=150)
    location = models.CharField(max_length=255)
    size_acres = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.farmer.farm_name})"
