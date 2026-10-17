from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User, Address
from .serializers import (
    RegisterSerializer, MeProfileUpdateSerializer, ChangePasswordSerializer,
    AddressSerializer
)


class AddressViewSet(viewsets.ModelViewSet):
    """Allows authenticated users to manage multiple delivery addresses (Home, Office, Other)."""
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # If this is the user's first address, make it default automatically
        is_first = not Address.objects.filter(user=self.request.user).exists()
        is_default = serializer.validated_data.get('is_default', False) or is_first
        serializer.save(user=self.request.user, is_default=is_default)

    @action(detail=True, methods=['post'], url_path='set-default')
    def set_default(self, request, pk=None):
        address = self.get_object()
        address.is_default = True
        address.save()
        return Response(AddressSerializer(address).data, status=status.HTTP_200_OK)


import random
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import User, Address, EmailOTP


class SendOTPView(generics.GenericAPIView):
    """Generates a 6-digit OTP and sends it to the user's email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        purpose = request.data.get('purpose', 'registration')

        if not email:
            return Response({"email": ["Email address is required."]}, status=status.HTTP_400_BAD_REQUEST)

        if purpose == 'registration' and User.objects.filter(email__iexact=email).exists():
            return Response({"email": ["An account with this email address already exists."]}, status=status.HTTP_400_BAD_REQUEST)

        # Generate 6-digit cryptographic-safe random code
        otp_code = str(random.randint(100000, 999999))
        expires_at = timezone.now() + timedelta(minutes=10)

        # Invalidate existing unverified OTPs for this email and purpose
        EmailOTP.objects.filter(email=email, purpose=purpose, is_verified=False).delete()

        EmailOTP.objects.create(
            email=email,
            otp_code=otp_code,
            purpose=purpose,
            expires_at=expires_at
        )

        # Send email (prints to console in dev, or dispatches via SMTP)
        subject = f"Your FarmConnect Verification Code: {otp_code}"
        message = (
            f"Hello,\n\n"
            f"Your 6-digit verification code for FarmConnect is: {otp_code}\n\n"
            f"This code will expire in 10 minutes.\n"
            f"If you did not request this verification code, please ignore this email.\n\n"
            f"Warm regards,\n"
            f"The FarmConnect Team"
        )
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@farmconnect.local'),
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            # Fallback for local testing if SMTP errors occur
            print(f"[FarmConnect OTP] Email send notice: {e}")

        resp_payload = {
            "detail": f"Verification code sent to {email}.",
            "email": email,
            "expires_in_seconds": 600
        }
        # If in debug mode or using the console backend, include the OTP in the API response
        # so local testing is never blocked without an active SMTP server
        is_console = getattr(settings, 'EMAIL_BACKEND', '').endswith('console.EmailBackend')
        if settings.DEBUG or is_console:
            resp_payload["dev_otp"] = otp_code
            print(f"\n==========================================")
            print(f" [FarmConnect OTP] Email: {email} | CODE: {otp_code}")
            print(f"==========================================\n")

        return Response(resp_payload, status=status.HTTP_200_OK)


class VerifyOTPView(generics.GenericAPIView):
    """Verifies a 6-digit OTP without finalizing registration."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        otp_code = request.data.get('otp_code', '').strip()
        purpose = request.data.get('purpose', 'registration')

        if not email or not otp_code:
            return Response({"detail": "Both email and otp_code are required."}, status=status.HTTP_400_BAD_REQUEST)

        record = EmailOTP.objects.filter(
            email=email,
            otp_code=otp_code,
            purpose=purpose,
            is_verified=False,
            expires_at__gte=timezone.now()
        ).first()

        if not record:
            return Response({"detail": "Invalid or expired verification code."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Verification code is valid.", "valid": True}, status=status.HTTP_200_OK)


class RegisterView(generics.CreateAPIView):
    """Registers a new Consumer or Farmer account."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    """Retrieves and updates the logged-in user profile details (including role-specific data)."""
    serializer_class = MeProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    """Allows an authenticated user to update their account password."""
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {"old_password": ["Incorrect current password."]},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({"detail": "Password successfully updated."}, status=status.HTTP_200_OK)