from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ('consumer', 'Consumer'),
        ('farmer', 'Farmer'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='consumer')
    phone_number = models.CharField(max_length=15, blank=True)
    is_email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username


class EmailOTP(models.Model):
    PURPOSE_CHOICES = (
        ('registration', 'Account Registration'),
        ('password_reset', 'Password Reset'),
    )

    email = models.EmailField(db_index=True)
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='registration')
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'otp_code', 'is_verified']),
        ]

    def __str__(self):
        return f"OTP for {self.email} ({self.purpose}) - Verified: {self.is_verified}"


class Consumer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='consumer_profile')
    default_delivery_address = models.TextField(blank=True)

    def __str__(self):
        return self.user.username


class Address(models.Model):
    ADDRESS_TYPE_CHOICES = (
        ('home', 'Home'),
        ('office', 'Work / Office'),
        ('other', 'Other'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    address_type = models.CharField(max_length=15, choices=ADDRESS_TYPE_CHOICES, default='home')
    recipient_name = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    street_address = models.TextField(help_text="House/Flat/Block no., Street, Area")
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    landmark = models.CharField(max_length=150, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', '-created_at']
        verbose_name_plural = 'Addresses'

    def __str__(self):
        return f"{self.get_address_type_display()} - {self.user.username} ({self.street_address[:30]})"

    def full_address(self):
        parts = [self.street_address]
        if self.landmark:
            parts.append(f"Near {self.landmark}")
        city_state_pin = ", ".join(filter(None, [self.city, self.state, self.postal_code]))
        if city_state_pin:
            parts.append(city_state_pin)
        return ", ".join(parts)

    def save(self, *args, **kwargs):
        # If this address is set as default, clear other default addresses for this user
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
            # Sync with consumer_profile if present
            if hasattr(self.user, 'consumer_profile'):
                self.user.consumer_profile.default_delivery_address = self.full_address()
                self.user.consumer_profile.save(update_fields=['default_delivery_address'])
        super().save(*args, **kwargs)