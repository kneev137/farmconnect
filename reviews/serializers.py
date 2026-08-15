from rest_framework import serializers
from .models import Review
from orders.models import OrderItem


class ReviewSerializer(serializers.ModelSerializer):
    consumer_username = serializers.CharField(source='consumer.user.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    is_verified_purchase = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id', 'product', 'product_name', 'consumer', 'consumer_username',
            'rating', 'comment', 'is_verified_purchase', 'created_at'
        ]
        read_only_fields = ['id', 'consumer', 'created_at', 'is_verified_purchase']

    def get_is_verified_purchase(self, obj):
        if not obj.consumer or not obj.product:
            return False
        return OrderItem.objects.filter(
            order__consumer=obj.consumer,
            product=obj.product,
            order__status__in=['delivered', 'confirmed', 'shipped']
        ).exists()

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5 stars.")
        return value