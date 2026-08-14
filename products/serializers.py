from rest_framework import serializers
from .models import Product, Inventory, HarvestRecord


class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = ['id', 'product', 'quantity_available', 'last_updated']
        read_only_fields = ['id', 'last_updated']


class HarvestRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = HarvestRecord
        fields = ['id', 'product', 'harvest_date', 'quantity_harvested', 'notes']
        read_only_fields = ['id']


class ProductSerializer(serializers.ModelSerializer):
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    farmer_name = serializers.CharField(source='farm.farmer.farm_name', read_only=True)
    quantity_available = serializers.DecimalField(source='inventory.quantity_available', max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'farm', 'farm_name', 'farmer_name', 'name', 'category', 'description',
                   'price_per_unit', 'unit', 'is_active', 'quantity_available', 'created_at']
        read_only_fields = ['id', 'created_at']