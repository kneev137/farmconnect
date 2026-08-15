from rest_framework import permissions


class IsFarmOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission allowing only the owner farmer of the farm/product to edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if hasattr(obj, 'farm'):
            return obj.farm.farmer.user == request.user
        elif hasattr(obj, 'product'):
            return obj.product.farm.farmer.user == request.user
        return False