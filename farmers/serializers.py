from rest_framework import serializers
from django.db.models import Avg
from .models import Farmer, Farm
from products.models import Product


class FarmSerializer(serializers.ModelSerializer):
    farmer_id = serializers.PrimaryKeyRelatedField(source='farmer', read_only=True)
    farmer_name = serializers.CharField(source='farmer.farm_name', read_only=True)

    class Meta:
        model = Farm
        fields = ['id', 'farmer_id', 'farmer_name', 'name', 'location', 'size_acres', 'description', 'image', 'created_at']
        read_only_fields = ['id', 'farmer_id', 'farmer_name', 'created_at']


class FarmerProductSummarySerializer(serializers.ModelSerializer):
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    quantity_available = serializers.DecimalField(source='inventory.quantity_available', max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'description', 'price_per_unit', 'unit', 'image', 'farm_name', 'quantity_available', 'is_active']


class FarmerSerializer(serializers.ModelSerializer):
    farms = FarmSerializer(many=True, read_only=True)
    products = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Farmer
        fields = [
            'id', 'user', 'username', 'email', 'phone_number', 'farm_name',
            'bio', 'profile_image', 'verified', 'created_at', 'farms',
            'products', 'avg_rating', 'review_count'
        ]
        read_only_fields = ['id', 'user', 'username', 'email', 'phone_number', 'created_at', 'verified']

    def get_products(self, obj):
        products = Product.objects.filter(farm__farmer=obj, is_active=True).select_related('farm', 'inventory')
        return FarmerProductSummarySerializer(products, many=True, context=self.context).data

    def get_avg_rating(self, obj):
        products = Product.objects.filter(farm__farmer=obj)
        from reviews.models import Review
        avg = Review.objects.filter(product__in=products).aggregate(avg=Avg('rating'))['avg']
        return round(avg, 1) if avg is not None else None

    def get_review_count(self, obj):
        products = Product.objects.filter(farm__farmer=obj)
        from reviews.models import Review
        return Review.objects.filter(product__in=products).count()


class FarmerMetricsSerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_orders = serializers.IntegerField()
    active_orders = serializers.IntegerField()
    total_products = serializers.IntegerField()
    low_stock_products = serializers.IntegerField()