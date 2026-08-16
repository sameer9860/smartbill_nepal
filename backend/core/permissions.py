from rest_framework.permissions import BasePermission

from .exceptions import PaymentRequired
from .utils import set_current_tenant


def resolve_tenant(request):
    """Attach tenant from the authenticated user's profile onto the request."""
    tenant = getattr(request, 'tenant', None)
    if tenant is not None:
        return tenant

    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        return None

    profile = getattr(user, 'profile', None)
    if profile is None:
        return None

    tenant = profile.tenant
    if tenant is not None:
        request.tenant = tenant
        set_current_tenant(tenant)
        tenant.sync_expiry_status()
        # Refresh after possible status sync
        tenant.refresh_from_db(fields=['subscription_status'])
    return tenant


class HasActiveTrialOrSubscription(BasePermission):
    """
    Allow access only when the tenant's trial or paid subscription is valid.
    Raises 402 Payment Required when the trial/subscription has expired.
    """

    message = 'Active trial or subscription required.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        tenant = resolve_tenant(request)
        if tenant is None:
            return False

        if tenant.has_access():
            return True

        raise PaymentRequired({
            'detail': 'Your free trial has expired. Please subscribe to continue.',
            'code': 'trial_expired',
            'subscription_status': tenant.subscription_status,
            'trial_ends_at': tenant.trial_ends_at.isoformat() if tenant.trial_ends_at else None,
            'subscription_ends_at': (
                tenant.subscription_ends_at.isoformat()
                if tenant.subscription_ends_at
                else None
            ),
        })
