from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    CartView, CartItemViewSet, CartClearView, CheckoutView,
    OrderViewSet, FarmerOrdersView, UpdateDeliveryStatusView, SimulatePaymentView
)

router = DefaultRouter()
router.register('cart-items', CartItemViewSet, basename='cartitem')
router.register('orders', OrderViewSet, basename='order')

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart_detail'),
    path('cart/clear/', CartClearView.as_view(), name='cart_clear'),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('farmer-orders/', FarmerOrdersView.as_view(), name='farmer_orders'),
    path('deliveries/<int:pk>/status/', UpdateDeliveryStatusView.as_view(), name='update_delivery_status'),
    path('payments/<int:pk>/pay/', SimulatePaymentView.as_view(), name='simulate_payment'),
] + router.urls