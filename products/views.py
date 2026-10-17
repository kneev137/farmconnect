import django_filters
from django.db import models
from rest_framework import viewsets, permissions, generics, exceptions, filters
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, Inventory, HarvestRecord
from .serializers import ProductSerializer, InventorySerializer, HarvestRecordSerializer
from .permissions import IsFarmOwnerOrReadOnly
from accounts.permissions import IsFarmer, IsFarmerOrReadOnly
from farmers.models import Farmer, Farm


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name='price_per_unit', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price_per_unit', lookup_expr='lte')
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')
    farmer = django_filters.NumberFilter(field_name='farm__farmer_id')

    class Meta:
        model = Product
        fields = ['category', 'farm', 'is_active', 'farmer', 'min_price', 'max_price', 'in_stock']

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(inventory__quantity_available__gt=0)
        return queryset


class ProductViewSet(viewsets.ModelViewSet):
    """
    Public catalog of farm fresh produce with full search, category filtering, and sorting.
    Registered farmers can create, edit, or remove products belonging to their farms.
    """
    queryset = Product.objects.select_related('farm__farmer__user', 'inventory').prefetch_related('reviews').all()
    serializer_class = ProductSerializer
    permission_classes = [IsFarmerOrReadOnly, IsFarmOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'farm__name', 'farm__farmer__farm_name', 'farm__location']
    ordering_fields = ['price_per_unit', 'created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        # Annotate aggregate review stats to eliminate N+1 queries
        qs = qs.annotate(
            annotated_avg_rating=models.Avg('reviews__rating'),
            annotated_review_count=models.Count('reviews')
        )
        # For anonymous users or general catalog, only show active products by default
        if self.action == 'list' and not self.request.query_params.get('include_inactive'):
            return qs.filter(is_active=True)
        return qs


    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'farmer_profile'):
            raise exceptions.PermissionDenied("Only registered farmers can create products.")
        farm = serializer.validated_data['farm']
        if farm.farmer.user != self.request.user:
            raise exceptions.PermissionDenied("You can only add products to your own farm.")
        serializer.save()


class MyProductsView(generics.ListAPIView):
    """Returns all products (both active and inactive) belonging to the authenticated farmer."""
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def get_queryset(self):
        return Product.objects.filter(
            farm__farmer=self.request.user.farmer_profile
        ).select_related('farm', 'inventory').prefetch_related('reviews').order_by('-created_at')


class InventoryViewSet(viewsets.ModelViewSet):
    """Enables farmers to view and adjust live stock counts for their products."""
    serializer_class = InventorySerializer
    permission_classes = [permissions.IsAuthenticated, IsFarmer, IsFarmOwnerOrReadOnly]

    def get_queryset(self):
        return Inventory.objects.filter(
            product__farm__farmer__user=self.request.user
        ).select_related('product')


class HarvestRecordViewSet(viewsets.ModelViewSet):
    """Enables farmers to record daily or periodic harvest logs, auto-incrementing stock."""
    serializer_class = HarvestRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsFarmer, IsFarmOwnerOrReadOnly]

    def get_queryset(self):
        return HarvestRecord.objects.filter(
            product__farm__farmer__user=self.request.user
        ).select_related('product')

    def perform_create(self, serializer):
        product = serializer.validated_data['product']
        if product.farm.farmer.user != self.request.user:
            raise exceptions.PermissionDenied("You can only log harvest records for your own products.")
        
        harvest = serializer.save()
        # Auto increment inventory stock on harvest
        inventory, _ = Inventory.objects.get_or_create(product=product)
        inventory.quantity_available += harvest.quantity_harvested
        inventory.save()