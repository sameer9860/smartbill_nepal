from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .api_views import (
    ChangePasswordAPIView,
    DeleteAccountAPIView,
    LoginAPIView,
    MeAPIView,
    ProfileUpdateAPIView,
    RegisterAPIView,
)

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='api_register'),
    path('login/', LoginAPIView.as_view(), name='api_login'),
    path('me/', MeAPIView.as_view(), name='api_me'),
    path('profile/', ProfileUpdateAPIView.as_view(), name='api_profile'),
    path('change-password/', ChangePasswordAPIView.as_view(), name='api_change_password'),
    path('delete-account/', DeleteAccountAPIView.as_view(), name='api_delete_account'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
