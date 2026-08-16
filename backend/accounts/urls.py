from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    # Auth
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),

    # Profile
    path('profile/', views.profile, name='profile'),

    # Change password
    path('change-password/', views.change_password, name='change_password'),

    # Delete account
    path('delete-account/', views.delete_account, name='delete_account'),
]