from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, Inventory, HarvestRecord
from .serializers import ProductSerializer, InventorySerializer, HarvestRecordSerializer
from .permissions import IsFarmOwnerOrReadOnly


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('farm', 'farm__farmer', 'inventory').filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsFarmOwnerOrReadOnly]
    filterset_fields = ['category', 'farm']


class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [permissions.IsAuthenticated]


class HarvestRecordViewSet(viewsets.ModelViewSet):
    queryset = HarvestRecord.objects.all()
    serializer_class = HarvestRecordSerializer
    permission_classes = [permissions.IsAuthenticated]