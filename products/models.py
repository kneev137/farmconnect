from django.db import models
from farmers.models import Farm


class Product(models.Model):
    CATEGORY_CHOICES = (
        ('vegetable', 'Vegetable'),
        ('fruit', 'Fruit'),
        ('grain', 'Grain'),
        ('dairy', 'Dairy'),
        ('other', 'Other'),
    )
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    price_per_unit = models.DecimalField(max_digits=8, decimal_places=2)
    unit = models.CharField(max_length=20, help_text="e.g. kg, dozen, litre")
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Inventory(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='inventory')
    quantity_available = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.product.name}: {self.quantity_available}"


class HarvestRecord(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='harvest_records')
    harvest_date = models.DateField()
    quantity_harvested = models.DecimalField(max_digits=8, decimal_places=2)
    notes = models.TextField(blank=True, help_text="e.g. organic, freshly picked")

    def __str__(self):
        return f"{self.product.name} - {self.harvest_date}"