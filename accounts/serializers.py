from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Consumer
from farmers.models import Farmer


class ConsumerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consumer
        fields = ['id', 'default_delivery_address']


class FarmerProfileSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Farmer
        fields = ['id', 'farm_name', 'bio', 'verified']


class UserSerializer(serializers.ModelSerializer):
    consumer_profile = ConsumerProfileSerializer(read_only=True)
    farmer_profile = FarmerProfileSummarySerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number', 'role', 'consumer_profile', 'farmer_profile', 'created_at']
        read_only_fields = ['id', 'role', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    farm_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    default_delivery_address = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'phone_number', 'role', 'farm_name', 'default_delivery_address']

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        farm_name = validated_data.pop('farm_name', '')
        delivery_address = validated_data.pop('default_delivery_address', '')
        role = validated_data.get('role', 'consumer')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            phone_number=validated_data.get('phone_number', ''),
            role=role,
        )

        if role == 'consumer':
            Consumer.objects.create(user=user, default_delivery_address=delivery_address or '')
        elif role == 'farmer':
            name = farm_name if farm_name else f"{user.username}'s Farm"
            Farmer.objects.create(user=user, farm_name=name)

        return user


class MeProfileUpdateSerializer(serializers.ModelSerializer):
    default_delivery_address = serializers.CharField(required=False, allow_blank=True)
    farm_name = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number', 'role', 'default_delivery_address', 'farm_name', 'bio']
        read_only_fields = ['id', 'username', 'role']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.role == 'consumer' and hasattr(instance, 'consumer_profile'):
            data['default_delivery_address'] = instance.consumer_profile.default_delivery_address
        elif instance.role == 'farmer' and hasattr(instance, 'farmer_profile'):
            data['farm_name'] = instance.farmer_profile.farm_name
            data['bio'] = instance.farmer_profile.bio
            data['verified'] = instance.farmer_profile.verified
        return data

    def update(self, instance, validated_data):
        delivery_address = validated_data.pop('default_delivery_address', None)
        farm_name = validated_data.pop('farm_name', None)
        bio = validated_data.pop('bio', None)

        instance.email = validated_data.get('email', instance.email)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.save()

        if instance.role == 'consumer' and hasattr(instance, 'consumer_profile') and delivery_address is not None:
            instance.consumer_profile.default_delivery_address = delivery_address
            instance.consumer_profile.save()

        if instance.role == 'farmer' and hasattr(instance, 'farmer_profile'):
            if farm_name is not None:
                instance.farmer_profile.farm_name = farm_name
            if bio is not None:
                instance.farmer_profile.bio = bio
            instance.farmer_profile.save()

        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value