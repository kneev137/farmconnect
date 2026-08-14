from rest_framework import serializers
from .models import User, Consumer


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number', 'role', 'created_at']
        read_only_fields = ['id', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'phone_number', 'role']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            phone_number=validated_data.get('phone_number', ''),
            role=validated_data.get('role', 'consumer'),
        )
        if user.role == 'consumer':
            Consumer.objects.create(user=user)
        elif user.role == 'farmer':
            from farmers.models import Farmer
            Farmer.objects.create(user=user, farm_name=f"{user.username}'s Farm")
        return user


class ConsumerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Consumer
        fields = ['id', 'user', 'default_delivery_address']