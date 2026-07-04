import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
from django.utils import timezone
from datetime import timedelta
from .models import Product, InvoiceItem, Invoice
from django.db.models import Sum



# 1. LOW STOCK PREDICTION

def predict_low_stock():
    """
    Predicts which products will run out of stock
    based on average daily sales rate.
    Returns a list of products with days until stockout.
    """
    results = []
    products = Product.objects.all()

    for product in products:
        # Get sales in last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        items = InvoiceItem.objects.filter(
            product=product,
            invoice__created_at__gte=thirty_days_ago
        )

        total_sold = sum(item.quantity for item in items)
        avg_daily_sales = total_sold / 30

        if avg_daily_sales > 0:
            days_until_stockout = product.stock_quantity / avg_daily_sales
        else:
            days_until_stockout = 999  # No sales = no stockout risk

        results.append({
            'product': product,
            'avg_daily_sales': round(avg_daily_sales, 2),
            'days_until_stockout': round(days_until_stockout, 1),
            'risk': get_risk_level(days_until_stockout),
            'recommended_restock': max(0, int(avg_daily_sales * 30)),
        })

    # Sort by most urgent first
    results.sort(key=lambda x: x['days_until_stockout'])
    return results


def get_risk_level(days):
    """Classify risk level based on days until stockout."""
    if days <= 7:
        return 'CRITICAL'
    elif days <= 14:
        return 'HIGH'
    elif days <= 30:
        return 'MEDIUM'
    else:
        return 'LOW'


# 2. SALES FORECASTING


def forecast_sales(days_ahead=30):
    """
    Uses Linear Regression to forecast
    total revenue for the next N days.
    """
    daily_revenue = []
    labels = []

    for i in range(89, -1, -1):
        day = timezone.now().date() - timedelta(days=i)
        revenue = Invoice.objects.filter(
            created_at__date=day,
            status='PAID'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        daily_revenue.append(float(revenue))
        labels.append(day.strftime('%d %b'))

    if len(daily_revenue) < 7:
        return None

    X = np.array(range(len(daily_revenue))).reshape(-1, 1)
    y = np.array(daily_revenue)

    model = LinearRegression()
    model.fit(X, y)

    future_X = np.array(
        range(len(daily_revenue), len(daily_revenue) + days_ahead)
    ).reshape(-1, 1)
    forecast = model.predict(future_X)
    forecast = [max(0, round(f, 2)) for f in forecast]

    future_labels = []
    for i in range(1, days_ahead + 1):
        day = timezone.now().date() + timedelta(days=i)
        future_labels.append(day.strftime('%d %b'))

    return {
        'historical_labels': labels[-30:],
        'historical_data': daily_revenue[-30:],
        'forecast_labels': future_labels,
        'forecast_data': forecast,
        'total_forecast': round(sum(forecast), 2),
        'avg_daily_forecast': round(sum(forecast) / days_ahead, 2),
    }

# 3. TOP PRODUCT RECOMMENDATIONS

def get_product_recommendations():
    """
    Recommends products to restock based on
    sales velocity and current stock levels.
    """
    recommendations = []
    products = Product.objects.all()

    for product in products:
        # Sales in last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        items = InvoiceItem.objects.filter(
            product=product,
            invoice__created_at__gte=thirty_days_ago
        )
        total_sold = sum(item.quantity for item in items)
        revenue_generated = sum(
            item.quantity * item.unit_price for item in items
        )

        if total_sold > 0:
            recommendations.append({
                'product': product,
                'total_sold_30d': total_sold,
                'revenue_30d': round(float(revenue_generated), 2),
                'current_stock': product.stock_quantity,
                'restock_qty': max(0, total_sold * 2 - product.stock_quantity),
                'priority': 'HIGH' if product.is_low_stock else 'NORMAL',
            })

    # Sort by revenue generated (highest first)
    recommendations.sort(key=lambda x: x['revenue_30d'], reverse=True)
    return recommendations[:10]


# 4. SALES SUMMARY BY CATEGORY

def get_category_sales_summary():
    """
    Returns sales summary grouped by product category
    for the last 30 days.
    """
    thirty_days_ago = timezone.now() - timedelta(days=30)
    items = InvoiceItem.objects.filter(
        invoice__created_at__gte=thirty_days_ago
    ).select_related('product__category')

    category_data = {}
    for item in items:
        cat_name = item.product.category.name if item.product.category else 'Uncategorized'
        if cat_name not in category_data:
            category_data[cat_name] = {
                'total_qty': 0,
                'total_revenue': 0
            }
        category_data[cat_name]['total_qty'] += item.quantity
        category_data[cat_name]['total_revenue'] += float(
            item.quantity * item.unit_price
        )

    return category_data