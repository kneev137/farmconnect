from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CartView, CartItemViewSet, CheckoutView, OrderViewSet

router = DefaultRouter()
router.register('cart-items', CartItemViewSet, basename='cartitem')
router.register('orders', OrderViewSet, basename='order')

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart_detail'),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
] + router.urls