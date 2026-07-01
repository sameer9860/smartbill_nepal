from django.utils import timezone


def generate_invoice_number(invoice_id):
    """
    Generate invoice number in the format:
    INV-YYYYMMDD-000001
    Example:
    INV-20260701-000001
    """
    date_str = timezone.now().strftime("%Y%m%d")
    return f"INV-{date_str}-{invoice_id:06d}"