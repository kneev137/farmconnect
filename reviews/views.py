from rest_framework import viewsets, permissions, exceptions
from .models import Review
from .serializers import ReviewSerializer
from accounts.permissions import IsConsumerOrReadOnly


class IsReviewAuthorOrReadOnly(permissions.BasePermission):
    """Allows anyone to read reviews, but only the author consumer can edit or delete."""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.consumer.user == request.user


class ReviewViewSet(viewsets.ModelViewSet):
    """
    Publicly reads product reviews and enables verified consumers to post star ratings & feedback.
    """
    queryset = Review.objects.select_related('consumer__user', 'product').order_by('-created_at')
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsReviewAuthorOrReadOnly]
    filterset_fields = ['product']
    ordering_fields = ['rating', 'created_at']

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'consumer_profile'):
            raise exceptions.PermissionDenied("Only consumers can write reviews.")
        consumer = self.request.user.consumer_profile
        product = serializer.validated_data['product']

        if Review.objects.filter(product=product, consumer=consumer).exists():
            raise exceptions.ValidationError({"detail": "You have already submitted a review for this product."})

        serializer.save(consumer=consumer)