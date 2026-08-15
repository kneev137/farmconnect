from rest_framework import serializers
from .models import Farmer, Farm


class FarmSerializer(serializers.ModelSerializer):
    farmer_id = serializers.PrimaryKeyRelatedField(source='farmer', read_only=True)
    farmer_name = serializers.CharField(source='farmer.farm_name', read_only=True)

    class Meta:
        model = Farm
        fields = ['id', 'farmer_id', 'farmer_name', 'name', 'location', 'size_acres', 'description', 'image', 'created_at']
        read_only_fields = ['id', 'farmer_id', 'farmer_name', 'created_at']


class FarmerSerializer(serializers.ModelSerializer):
    farms = FarmSerializer(many=True, read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)

    class Meta:
        model = Farmer
        fields = ['id', 'user', 'username', 'email', 'phone_number', 'farm_name', 'bio', 'profile_image', 'verified', 'created_at', 'farms']
        read_only_fields = ['id', 'user', 'username', 'email', 'phone_number', 'created_at', 'verified']


class FarmerMetricsSerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_orders = serializers.IntegerField()
    active_orders = serializers.IntegerField()
    total_products = serializers.IntegerField()
    low_stock_products = serializers.IntegerField()