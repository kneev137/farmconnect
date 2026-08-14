from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, InventoryViewSet, HarvestRecordViewSet

router = DefaultRouter()
router.register('products', ProductViewSet)
router.register('inventory', InventoryViewSet)
router.register('harvest-records', HarvestRecordViewSet)

urlpatterns = router.urls