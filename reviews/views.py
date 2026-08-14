from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from .models import Review
from .serializers import ReviewSerializer


class IsReviewOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.consumer.user == request.user


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.select_related('consumer__user', 'product')
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsReviewOwnerOrReadOnly]
    filterset_fields = ['product']

    def perform_create(self, serializer):
        serializer.save(consumer=self.request.user.consumer_profile)