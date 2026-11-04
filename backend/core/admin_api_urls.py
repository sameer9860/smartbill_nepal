from django.urls import path

from .admin_api_views import (
    AdminDashboardAPIView,
    AdminReceiptDetailAPIView,
    AdminReceiptsAPIView,
    AdminTenantDetailAPIView,
    AdminTenantsAPIView,
    AdminUserDetailAPIView,
    AdminUsersAPIView,
)

urlpatterns = [
    path('admin/dashboard/', AdminDashboardAPIView.as_view(), name='admin_dashboard'),
    path('admin/tenants/', AdminTenantsAPIView.as_view(), name='admin_tenants'),
    path('admin/tenants/<int:tenant_id>/', AdminTenantDetailAPIView.as_view(), name='admin_tenant_detail'),
    path('admin/receipts/', AdminReceiptsAPIView.as_view(), name='admin_receipts'),
    path('admin/receipts/<int:receipt_id>/', AdminReceiptDetailAPIView.as_view(), name='admin_receipt_detail'),
    path('admin/users/', AdminUsersAPIView.as_view(), name='admin_users'),
    path('admin/users/<int:user_id>/', AdminUserDetailAPIView.as_view(), name='admin_user_detail'),
]

