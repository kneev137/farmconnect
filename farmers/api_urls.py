from rest_framework.routers import DefaultRouter
from .views import FarmerViewSet, FarmViewSet

router = DefaultRouter()
router.register('farmers', FarmerViewSet)
router.register('farms', FarmViewSet)

urlpatterns = router.urls