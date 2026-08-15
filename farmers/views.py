from django.db.models import Sum, F, DecimalField, ExpressionWrapper
from rest_framework import viewsets, permissions, generics, status, exceptions
from rest_framework.response import Response
from .models import Farmer, Farm
from .serializers import FarmerSerializer, FarmSerializer, FarmerMetricsSerializer
from .permissions import IsOwnerOrReadOnly
from accounts.permissions import IsFarmer, IsFarmerOrReadOnly
from products.models import Product
from orders.models import Order, OrderItem


class FarmerViewSet(viewsets.ModelViewSet):
    """
    Publicly lists verified and registered farmers.
    Only the farmer themselves can update their profile story and details.
    """
    queryset = Farmer.objects.select_related('user').prefetch_related('farms').all()
    serializer_class = FarmerSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    search_fields = ['farm_name', 'bio', 'user__username']
    filterset_fields = ['verified']


class FarmViewSet(viewsets.ModelViewSet):
    """
    Allows farmers to manage their farms.
    """
    queryset = Farm.objects.select_related('farmer__user').all()
    serializer_class = FarmSerializer
    permission_classes = [IsFarmerOrReadOnly, IsOwnerOrReadOnly]
    search_fields = ['name', 'location', 'description']

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'farmer_profile'):
            raise exceptions.PermissionDenied("Only registered farmers can create farms.")
        farmer = self.request.user.farmer_profile
        serializer.save(farmer=farmer)


class FarmerMetricsView(generics.GenericAPIView):
    """
    Provides real-time business performance analytics for the authenticated farmer.
    """
    permission_classes = [permissions.IsAuthenticated, IsFarmer]
    serializer_class = FarmerMetricsSerializer

    def get(self, request, *args, **kwargs):
        farmer = request.user.farmer_profile

        # Aggregate revenue from items belonging to this farmer
        items = OrderItem.objects.filter(
            product__farm__farmer=farmer
        ).exclude(order__status='cancelled')

        revenue_expr = ExpressionWrapper(F('quantity') * F('price_at_purchase'), output_field=DecimalField())
        revenue_sum = items.annotate(item_total=revenue_expr).aggregate(total=Sum('item_total'))['total'] or 0

        farmer_orders = Order.objects.filter(items__product__farm__farmer=farmer).distinct()
        total_orders = farmer_orders.count()
        active_orders = farmer_orders.filter(status__in=['pending', 'confirmed', 'shipped']).count()

        total_products = Product.objects.filter(farm__farmer=farmer).count()
        low_stock_products = Product.objects.filter(farm__farmer=farmer, inventory__quantity_available__lte=5).count()

        data = {
            'total_revenue': revenue_sum,
            'total_orders': total_orders,
            'active_orders': active_orders,
            'total_products': total_products,
            'low_stock_products': low_stock_products,
        }
        return Response(data, status=status.HTTP_200_OK)