from rest_framework import serializers
from .models import Farmer, Farm


class FarmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farm
        fields = ['id', 'farmer', 'name', 'location', 'size_acres', 'description', 'created_at']
        read_only_fields = ['id', 'created_at', 'farmer']


class FarmerSerializer(serializers.ModelSerializer):
    farms = FarmSerializer(many=True, read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Farmer
        fields = ['id', 'user', 'username', 'farm_name', 'bio', 'verified', 'created_at', 'farms']
        read_only_fields = ['id', 'user', 'created_at', 'verified']