from django.db import models
from farmers.models import Farm


class Category(models.Model):
    slug = models.SlugField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=150)
    category_rel = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    category = models.CharField(max_length=50, default='other')
    description = models.TextField(blank=True)
    price_per_unit = models.DecimalField(max_digits=8, decimal_places=2)
    unit = models.CharField(max_length=20, help_text="e.g. kg, dozen, litre")
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(price_per_unit__gt=0),
                name='chk_product_price_positive'
            )
        ]

    def __str__(self):
        return self.name


class Inventory(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='inventory')
    quantity_available = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity_available__gte=0),
                name='chk_inventory_stock_non_negative'
            )
        ]

    def __str__(self):
        return f"{self.product.name}: {self.quantity_available}"


class HarvestRecord(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='harvest_records')
    harvest_date = models.DateField()
    quantity_harvested = models.DecimalField(max_digits=10, decimal_places=3)
    notes = models.TextField(blank=True, help_text="e.g. organic, freshly picked")

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity_harvested__gt=0),
                name='chk_harvest_quantity_positive'
            )
        ]

    def __str__(self):
        return f"{self.product.name} - {self.harvest_date}"