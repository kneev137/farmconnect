from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Only the farmer who owns this object can edit/delete it."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        owner = obj.user if hasattr(obj, 'user') else obj.farmer.user
        return owner == request.user