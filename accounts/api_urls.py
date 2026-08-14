from django.urls import path
from .api_views import RegisterView, MeView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='api_register'),
    path('me/', MeView.as_view(), name='api_me'),
]