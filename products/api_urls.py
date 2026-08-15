from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, InventoryViewSet, HarvestRecordViewSet, MyProductsView

router = DefaultRouter()
router.register('products', ProductViewSet, basename='product')
router.register('inventory', InventoryViewSet, basename='inventory')
router.register('harvest-records', HarvestRecordViewSet, basename='harvest-record')

urlpatterns = [
    path('my-products/', MyProductsView.as_view(), name='my_products'),
] + router.urls