from rest_framework import permissions


class IsConsumer(permissions.BasePermission):
    """Allows access only to authenticated consumers."""
    message = "Only consumers are allowed to perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'consumer')


class IsFarmer(permissions.BasePermission):
    """Allows access only to authenticated farmers."""
    message = "Only registered farmers are allowed to perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'farmer')


class IsAdminRole(permissions.BasePermission):
    """Allows access to admins or staff members."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.role == 'admin'))


class IsConsumerOrReadOnly(permissions.BasePermission):
    """Read-only for everyone; write permissions restricted to consumers."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.role == 'consumer')


class IsFarmerOrReadOnly(permissions.BasePermission):
    """Read-only for everyone; write permissions restricted to farmers."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.role == 'farmer')
