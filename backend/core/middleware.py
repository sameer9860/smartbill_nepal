from django.db import DatabaseError
from .utils import set_current_tenant
from .models import UserProfile, Tenant

class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            try:
                # Get or create the profile for the authenticated user
                profile, created = UserProfile.objects.get_or_create(user=request.user)
                if not profile.tenant:
                    # Automatically generate a default store/tenant if missing
                    tenant = Tenant.objects.create(name=f"{request.user.username}'s Store")
                    profile.tenant = tenant
                    profile.save()
                
                request.tenant = profile.tenant
                set_current_tenant(profile.tenant)
            except DatabaseError:
                # Fallback if database migrations have not been applied yet
                set_current_tenant(None)
        else:
            set_current_tenant(None)

        response = self.get_response(request)
        return response
