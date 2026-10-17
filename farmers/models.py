from django.db import models
from accounts.models import User


class Farmer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='farmer_profile')
    farm_name = models.CharField(max_length=150)
    bio = models.TextField(blank=True, help_text="Farmer's story, shown to consumers")
    profile_image = models.ImageField(upload_to='farmers/', blank=True, null=True)
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.farm_name


class City(models.Model):
    name = models.CharField(max_length=100)
    state = models.CharField(max_length=100)

    class Meta:
        unique_together = ('name', 'state')
        ordering = ['name']

    def __str__(self):
        return f"{self.name}, {self.state}"


class Farm(models.Model):
    farmer = models.ForeignKey(Farmer, on_delete=models.CASCADE, related_name='farms')
    name = models.CharField(max_length=150)
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True, blank=True, related_name='farms')
    location = models.CharField(max_length=255, help_text="Specific street / locality address")
    size_acres = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='farms/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.farmer.farm_name})"

