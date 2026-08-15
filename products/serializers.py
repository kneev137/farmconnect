from decimal import Decimal
from django.utils import timezone
from rest_framework import serializers
from django.db.models import Avg
from .models import Product, Inventory, HarvestRecord


class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    unit = serializers.CharField(source='product.unit', read_only=True)

    class Meta:
        model = Inventory
        fields = ['id', 'product', 'product_name', 'unit', 'quantity_available', 'last_updated']
        read_only_fields = ['id', 'last_updated']


class HarvestRecordSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    unit = serializers.CharField(source='product.unit', read_only=True)

    class Meta:
        model = HarvestRecord
        fields = ['id', 'product', 'product_name', 'unit', 'harvest_date', 'quantity_harvested', 'notes']
        read_only_fields = ['id']


class ProductSerializer(serializers.ModelSerializer):
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    farmer_name = serializers.CharField(source='farm.farmer.farm_name', read_only=True)
    farmer_id = serializers.IntegerField(source='farm.farmer.id', read_only=True)
    farm_location = serializers.CharField(source='farm.location', read_only=True)
    quantity_available = serializers.SerializerMethodField()
    initial_stock = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, write_only=True, default=0)
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    freshness = serializers.SerializerMethodField()
    price_breakdown = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'farm', 'farm_name', 'farmer_id', 'farmer_name', 'farm_location',
            'name', 'category', 'description', 'price_per_unit', 'unit', 'image', 'is_active',
            'quantity_available', 'initial_stock', 'avg_rating', 'review_count',
            'freshness', 'price_breakdown', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_quantity_available(self, obj):
        if hasattr(obj, 'inventory'):
            return obj.inventory.quantity_available
        return 0

    def get_avg_rating(self, obj):
        avg = obj.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(avg, 1) if avg is not None else None

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_freshness(self, obj):
        latest_harvest = obj.harvest_records.order_by('-harvest_date').first()
        if latest_harvest:
            today = timezone.now().date()
            delta_days = (today - latest_harvest.harvest_date).days
            if delta_days == 0:
                label = "Harvested today"
            elif delta_days == 1:
                label = "Harvested yesterday"
            elif delta_days > 1:
                label = f"Harvested {delta_days} days ago"
            else:
                label = "Fresh harvest scheduled"
            return {
                "latest_harvest_date": latest_harvest.harvest_date,
                "days_since_harvest": delta_days,
                "label": label,
                "notes": latest_harvest.notes or "Freshly picked"
            }
        return {
            "latest_harvest_date": None,
            "days_since_harvest": None,
            "label": "Farm fresh listing",
            "notes": "Direct from farm"
        }

    def get_price_breakdown(self, obj):
        price = Decimal(str(obj.price_per_unit))
        farmer_share = round(price * Decimal('0.90'), 2)
        platform_fee = round(price * Decimal('0.10'), 2)
        return {
            "farmer_share": str(farmer_share),
            "farmer_percentage": "90%",
            "platform_fee": str(platform_fee),
            "platform_percentage": "10%",
            "transparency_note": "90% of each purchase goes directly to the local farmer."
        }

    def create(self, validated_data):
        initial_stock = validated_data.pop('initial_stock', 0)
        product = Product.objects.create(**validated_data)
        Inventory.objects.create(product=product, quantity_available=initial_stock)
        return product