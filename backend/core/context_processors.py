from django.db.models import F
from .models import Product

def low_stock_count(request):
    count = Product.objects.filter(
        stock_quantity__lte=F('low_stock_threshold')
    ).count()
    return {'low_stock_count': count}