from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Consumer, Address
from farmers.models import Farmer

class AddressSerializer(serializers.ModelSerializer):
    full_address = serializers.CharField(read_only=True)

    class Meta:
        model = Address
        fields = [
            'id', 'address_type', 'recipient_name', 'phone_number',
            'street_address', 'city', 'state', 'postal_code', 'landmark',
            'is_default', 'full_address', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'full_address']


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
    addresses = AddressSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone_number', 'role',
            'is_email_verified', 'consumer_profile', 'farmer_profile', 'addresses', 'created_at'
        ]
        read_only_fields = ['id', 'role', 'is_email_verified', 'created_at']



class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    farm_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    default_delivery_address = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'confirm_password', 'phone_number', 'role', 'farm_name', 'default_delivery_address']

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("A valid email address is required.")
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return value.lower()

    def validate(self, attrs):
        confirm_pwd = attrs.get('confirm_password')
        if confirm_pwd is not None and confirm_pwd != '':
            if attrs.get('password') != confirm_pwd:
                raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        farm_name = validated_data.pop('farm_name', '')
        delivery_address = validated_data.pop('default_delivery_address', '')
        role = validated_data.get('role', 'consumer')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            phone_number=validated_data.get('phone_number', ''),
            role=role,
            is_email_verified=True
        )

        # All users get a consumer profile so anyone (including farmers) can buy produce
        Consumer.objects.create(user=user, default_delivery_address=delivery_address or '')

        if role == 'farmer':
            name = farm_name if farm_name else f"{user.username}'s Farm"
            farmer_profile = Farmer.objects.create(user=user, farm_name=name)
            from farmers.models import Farm
            Farm.objects.create(
                farmer=farmer_profile,
                name=name,
                location=delivery_address or "Main Farm Location",
                description=f"Primary farm for {name}."
            )

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
        data['addresses'] = AddressSerializer(instance.addresses.all(), many=True).data
        if hasattr(instance, 'consumer_profile') and instance.consumer_profile:
            data['default_delivery_address'] = instance.consumer_profile.default_delivery_address
        if hasattr(instance, 'farmer_profile') and instance.farmer_profile:
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