from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from .models import Farmer, Farm
from .serializers import FarmerSerializer, FarmSerializer
from .permissions import IsOwnerOrReadOnly


class FarmerViewSet(viewsets.ModelViewSet):
    queryset = Farmer.objects.all()
    serializer_class = FarmerSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]


class FarmViewSet(viewsets.ModelViewSet):
    queryset = Farm.objects.all()
    serializer_class = FarmSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def perform_create(self, serializer):
        farmer = Farmer.objects.get(user=self.request.user)
        serializer.save(farmer=farmer)