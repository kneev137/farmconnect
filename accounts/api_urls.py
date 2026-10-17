from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    RegisterView, MeView, ChangePasswordView, AddressViewSet,
    SendOTPView, VerifyOTPView
)

router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='api_register'),
    path('send-otp/', SendOTPView.as_view(), name='api_send_otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='api_verify_otp'),
    path('me/', MeView.as_view(), name='api_me'),
    path('change-password/', ChangePasswordView.as_view(), name='api_change_password'),
    path('', include(router.urls)),
]