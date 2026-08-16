from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api_views import (
    CategoryViewSet,
    CustomerViewSet,
    DashboardAPIView,
    InvoiceViewSet,
    ProductViewSet,
    StockMovementViewSet,
    SubscribeAPIView,
    SubscriptionPlansAPIView,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='api-category')
router.register(r'products', ProductViewSet, basename='api-product')
router.register(r'customers', CustomerViewSet, basename='api-customer')
router.register(r'invoices', InvoiceViewSet, basename='api-invoice')
router.register(r'stock-movements', StockMovementViewSet, basename='api-stock-movement')

urlpatterns = [
    path('dashboard/', DashboardAPIView.as_view(), name='api_dashboard'),
    path('subscription/plans/', SubscriptionPlansAPIView.as_view(), name='api_subscription_plans'),
    path('subscription/subscribe/', SubscribeAPIView.as_view(), name='api_subscribe'),
    path('', include(router.urls)),
]
