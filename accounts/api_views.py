from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import User
from .serializers import RegisterSerializer, MeProfileUpdateSerializer, ChangePasswordSerializer


class RegisterView(generics.CreateAPIView):
    """Registers a new Consumer or Farmer account."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    """Retrieves and updates the logged-in user profile details (including role-specific data)."""
    serializer_class = MeProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    """Allows an authenticated user to update their account password."""
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {"old_password": ["Incorrect current password."]},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({"detail": "Password successfully updated."}, status=status.HTTP_200_OK)