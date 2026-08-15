from django.urls import path
from .api_views import RegisterView, MeView, ChangePasswordView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='api_register'),
    path('me/', MeView.as_view(), name='api_me'),
    path('change-password/', ChangePasswordView.as_view(), name='api_change_password'),
]