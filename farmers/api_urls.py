from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import FarmerViewSet, FarmViewSet, FarmerMetricsView

router = DefaultRouter()
router.register('farmers', FarmerViewSet, basename='farmer')
router.register('farms', FarmViewSet, basename='farm')

urlpatterns = [
    path('farmer/metrics/', FarmerMetricsView.as_view(), name='farmer_metrics'),
] + router.urls