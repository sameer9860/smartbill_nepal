from django.utils import timezone


def generate_invoice_number(tenant=None):
    """
    Generate a unique invoice number per tenant in the format:
    INV-YYYYMMDD-000001
    The sequence resets per tenant, not globally.
    Handles deletions and collisions gracefully.
    """
    from .models import Invoice
    date_str = timezone.now().strftime("%Y%m%d")
    
    if tenant:
        base_count = Invoice._base_manager.filter(tenant=tenant).count() + 1
    else:
        base_count = Invoice._base_manager.count() + 1

    while True:
        num = f"INV-{date_str}-{base_count:06d}"
        # Check uniqueness within this tenant only
        if tenant:
            exists = Invoice._base_manager.filter(tenant=tenant, invoice_number=num).exists()
        else:
            exists = Invoice._base_manager.filter(invoice_number=num).exists()
            
        if not exists:
            return num
        base_count += 1

# Tenant context thread-local storage
import threading

_thread_locals = threading.local()

def get_current_tenant():
    return getattr(_thread_locals, 'tenant', None)

def set_current_tenant(tenant):
    _thread_locals.tenant = tenant