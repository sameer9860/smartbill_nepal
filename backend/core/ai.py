import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from django.utils import timezone
from django.db.models import Sum, Count
from datetime import timedelta
from .models import Product, InvoiceItem, Invoice


# HELPER: Get daily sales for a product

def get_daily_sales(product, days=30):
    """Returns average daily sales for a product over N days."""
    start = timezone.now() - timedelta(days=days)
    items = InvoiceItem.objects.filter(
        product=product,
        invoice__created_at__gte=start,
        invoice__status='PAID'
    )
    total_sold = sum(item.quantity for item in items)
    return total_sold / days


def get_period_sales(product, days):
    """Returns total quantity sold in last N days."""
    start = timezone.now() - timedelta(days=days)
    items = InvoiceItem.objects.filter(
        product=product,
        invoice__created_at__gte=start,
        invoice__status='PAID'
    )
    return sum(item.quantity for item in items)


def get_period_revenue(product, days):
    """Returns total revenue for a product in last N days."""
    start = timezone.now() - timedelta(days=days)
    items = InvoiceItem.objects.filter(
        product=product,
        invoice__created_at__gte=start,
        invoice__status='PAID'
    )
    return float(sum(item.quantity * item.unit_price for item in items))


# 1. STOCK RISK PREDICTION

def predict_low_stock():
    """
    Predicts days until stockout per product
    based on average daily sales rate.
    """
    results = []
    for product in Product.objects.select_related('category').all():
        avg_daily = get_daily_sales(product, days=30)

        if avg_daily > 0:
            days_left = round(product.stock_quantity / avg_daily, 1)
        else:
            days_left = 999

        results.append({
            'product': product,
            'avg_daily_sales': round(avg_daily, 2),
            'days_until_stockout': days_left,
            'risk': _risk_level(days_left),
            'recommended_restock': max(0, int(avg_daily * 30)),
        })

    results.sort(key=lambda x: x['days_until_stockout'])
    return results


def _risk_level(days):
    if days <= 7:
        return 'CRITICAL'
    elif days <= 14:
        return 'HIGH'
    elif days <= 30:
        return 'MEDIUM'
    else:
        return 'LOW'


# 2. SALES FORECASTING (Linear Regression)

def forecast_sales(days_ahead=30):
    """
    Uses Linear Regression on last 90 days
    to forecast next N days revenue.
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

    if sum(daily_revenue) == 0:
        return None

    X = np.array(range(len(daily_revenue))).reshape(-1, 1)
    y = np.array(daily_revenue)

    model = LinearRegression()
    model.fit(X, y)

    future_X = np.array(
        range(len(daily_revenue), len(daily_revenue) + days_ahead)
    ).reshape(-1, 1)
    forecast = [max(0, round(f, 2)) for f in model.predict(future_X)]

    future_labels = [
        (timezone.now().date() + timedelta(days=i)).strftime('%d %b')
        for i in range(1, days_ahead + 1)
    ]

    return {
        'historical_labels': labels[-30:],
        'historical_data': daily_revenue[-30:],
        'forecast_labels': future_labels,
        'forecast_data': forecast,
        'total_forecast': round(sum(forecast), 2),
        'avg_daily_forecast': round(sum(forecast) / days_ahead, 2),
        'trend': 'UP' if model.coef_[0] > 0 else 'DOWN',
        'trend_value': round(float(model.coef_[0]), 2),
    }


# 3. ABC ANALYSIS

def abc_analysis():
    """
    Classifies products into A, B, C categories
    based on Pareto principle (80/20 rule).

    A = Top products generating 80% of revenue
    B = Next 15% of revenue
    C = Bottom 5% of revenue
    """
    products = Product.objects.select_related('category').all()
    product_revenue = []

    for product in products:
        revenue = get_period_revenue(product, days=30)
        qty = get_period_sales(product, days=30)
        product_revenue.append({
            'product': product,
            'revenue': revenue,
            'qty_sold': qty,
        })

    # Sort by revenue descending
    product_revenue.sort(key=lambda x: x['revenue'], reverse=True)
    total_revenue = sum(p['revenue'] for p in product_revenue)

    if total_revenue == 0:
        return {'A': [], 'B': [], 'C': [], 'total_revenue': 0}

    cumulative = 0
    a_items, b_items, c_items = [], [], []

    for item in product_revenue:
        cumulative += item['revenue']
        pct = (cumulative / total_revenue) * 100
        item['cumulative_pct'] = round(pct, 1)
        item['revenue_pct'] = round(
            (item['revenue'] / total_revenue) * 100, 1
        )

        if pct <= 80:
            item['class'] = 'A'
            a_items.append(item)
        elif pct <= 95:
            item['class'] = 'B'
            b_items.append(item)
        else:
            item['class'] = 'C'
            c_items.append(item)

    return {
        'A': a_items,
        'B': b_items,
        'C': c_items,
        'all': product_revenue,
        'total_revenue': round(total_revenue, 2),
        'a_revenue': round(sum(p['revenue'] for p in a_items), 2),
        'b_revenue': round(sum(p['revenue'] for p in b_items), 2),
        'c_revenue': round(sum(p['revenue'] for p in c_items), 2),
        'a_count': len(a_items),
        'b_count': len(b_items),
        'c_count': len(c_items),
    }


# 4. SALES TREND DETECTION

def detect_trends():
    """
    Compares last 7 days vs previous 7 days
    per product to detect UP, DOWN, or STABLE trends.
    """
    results = []

    for product in Product.objects.select_related('category').all():
        recent = get_period_sales(product, days=7)
        previous = get_period_sales(product, days=14) - recent

        if previous == 0 and recent == 0:
            continue

        if previous == 0:
            change_pct = 100.0
        else:
            change_pct = round(((recent - previous) / previous) * 100, 1)

        if change_pct >= 20:
            trend = 'UP'
            trend_icon = '📈'
        elif change_pct <= -20:
            trend = 'DOWN'
            trend_icon = '📉'
        else:
            trend = 'STABLE'
            trend_icon = '➡️'

        results.append({
            'product': product,
            'recent_7d': recent,
            'previous_7d': previous,
            'change_pct': change_pct,
            'trend': trend,
            'trend_icon': trend_icon,
        })

    results.sort(key=lambda x: abs(x['change_pct']), reverse=True)
    return results


# 5. BUSINESS HEALTH SCORE

def business_health_score():
    """
    Calculates an overall business health score (0-100)
    based on 5 key metrics.
    """

    scores = {}
    breakdown = {}

    # --- Metric 1: Stock Health (20 points)
    total_products = Product.objects.count()
    low_stock_count = sum(
        1 for p in Product.objects.all() if p.is_low_stock
    )
    if total_products > 0:
        stock_score = round(
            ((total_products - low_stock_count) / total_products) * 20
        )
    else:
        stock_score = 0
    scores['stock'] = stock_score
    breakdown['stock'] = {
        'label': 'Stock Health',
        'score': stock_score,
        'max': 20,
        'detail': f'{total_products - low_stock_count}/{total_products} products well stocked',
        'icon': 'bi-box-seam',
        'color': 'success' if stock_score >= 15 else 'warning' if stock_score >= 10 else 'danger',
    }

    # --- Metric 2: Payment Collection Rate (20 points)
    total_invoices = Invoice.objects.count()
    paid_invoices = Invoice.objects.filter(status='PAID').count()
    if total_invoices > 0:
        collection_rate = paid_invoices / total_invoices
        collection_score = round(collection_rate * 20)
    else:
        collection_score = 0
        collection_rate = 0
    scores['collection'] = collection_score
    breakdown['collection'] = {
        'label': 'Payment Collection',
        'score': collection_score,
        'max': 20,
        'detail': f'{round(collection_rate * 100, 1)}% invoices paid',
        'icon': 'bi-cash-coin',
        'color': 'success' if collection_score >= 15 else 'warning' if collection_score >= 10 else 'danger',
    }

    # --- Metric 3: Sales Growth (20 points)
    this_month = Invoice.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=30),
        status='PAID'
    ).aggregate(total=Sum('total_amount'))['total'] or 0

    last_month = Invoice.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=60),
        created_at__lt=timezone.now() - timedelta(days=30),
        status='PAID'
    ).aggregate(total=Sum('total_amount'))['total'] or 0

    if last_month > 0:
        growth_pct = ((float(this_month) - float(last_month)) / float(last_month)) * 100
    else:
        growth_pct = 0

    if growth_pct >= 20:
        growth_score = 20
    elif growth_pct >= 10:
        growth_score = 16
    elif growth_pct >= 0:
        growth_score = 12
    elif growth_pct >= -10:
        growth_score = 8
    else:
        growth_score = 4

    scores['growth'] = growth_score
    breakdown['growth'] = {
        'label': 'Sales Growth',
        'score': growth_score,
        'max': 20,
        'detail': f'{round(growth_pct, 1)}% vs last month',
        'icon': 'bi-graph-up-arrow',
        'color': 'success' if growth_score >= 15 else 'warning' if growth_score >= 10 else 'danger',
    }

    # --- Metric 4: Inventory Turnover (20 points)
    products_with_sales = sum(
        1 for p in Product.objects.all()
        if get_period_sales(p, days=30) > 0
    )
    if total_products > 0:
        turnover_rate = products_with_sales / total_products
        turnover_score = round(turnover_rate * 20)
    else:
        turnover_score = 0
        turnover_rate = 0
    scores['turnover'] = turnover_score
    breakdown['turnover'] = {
        'label': 'Inventory Turnover',
        'score': turnover_score,
        'max': 20,
        'detail': f'{products_with_sales}/{total_products} products sold this month',
        'icon': 'bi-arrow-repeat',
        'color': 'success' if turnover_score >= 15 else 'warning' if turnover_score >= 10 else 'danger',
    }

    # --- Metric 5: Critical Stock Risk (20 points)
    critical_count = sum(
        1 for p in predict_low_stock()
        if p['risk'] == 'CRITICAL'
    )
    if critical_count == 0:
        risk_score = 20
    elif critical_count <= 2:
        risk_score = 14
    elif critical_count <= 5:
        risk_score = 8
    else:
        risk_score = 2
    scores['risk'] = risk_score
    breakdown['risk'] = {
        'label': 'Stock Risk',
        'score': risk_score,
        'max': 20,
        'detail': f'{critical_count} products at critical risk',
        'icon': 'bi-shield-check',
        'color': 'success' if risk_score >= 15 else 'warning' if risk_score >= 10 else 'danger',
    }

    total_score = sum(scores.values())

    if total_score >= 80:
        grade = 'Excellent'
        grade_color = 'success'
        grade_icon = '🌟'
    elif total_score >= 60:
        grade = 'Good'
        grade_color = 'primary'
        grade_icon = '👍'
    elif total_score >= 40:
        grade = 'Fair'
        grade_color = 'warning'
        grade_icon = '⚠️'
    else:
        grade = 'Needs Attention'
        grade_color = 'danger'
        grade_icon = '🚨'

    return {
        'total_score': total_score,
        'grade': grade,
        'grade_color': grade_color,
        'grade_icon': grade_icon,
        'breakdown': breakdown,
    }


# ─────────────────────────────────────────
# 6. SMART REORDER POINT CALCULATOR
# ─────────────────────────────────────────

def smart_reorder_plan(lead_time_days=7):
    """
    Calculates reorder point and order quantity
    for each product using:
    Reorder Point = (Avg Daily Sales × Lead Time) + Safety Stock
    Order Qty = 30 days of demand
    """
    plan = []

    for product in Product.objects.select_related('category').all():
        avg_daily = get_daily_sales(product, days=30)

        if avg_daily == 0:
            continue

        safety_stock = round(avg_daily * 7)
        reorder_point = round((avg_daily * lead_time_days) + safety_stock)
        order_qty = round(avg_daily * 30)
        estimated_cost = round(order_qty * float(product.price), 2)

        needs_order = product.stock_quantity <= reorder_point

        plan.append({
            'product': product,
            'avg_daily_sales': round(avg_daily, 2),
            'safety_stock': safety_stock,
            'reorder_point': reorder_point,
            'order_qty': order_qty,
            'estimated_cost': estimated_cost,
            'needs_order_now': needs_order,
            'current_stock': product.stock_quantity,
        })

    plan.sort(key=lambda x: x['needs_order_now'], reverse=True)
    return plan


# ─────────────────────────────────────────
# 7. WHAT TO ORDER THIS WEEK
# ─────────────────────────────────────────

def weekly_order_list():
    """
    Generates a simple actionable list of
    products to order this week with quantities and cost.
    """
    plan = smart_reorder_plan()
    order_list = [p for p in plan if p['needs_order_now']]
    total_cost = sum(p['estimated_cost'] for p in order_list)
    return {
        'items': order_list,
        'total_items': len(order_list),
        'total_estimated_cost': round(total_cost, 2),
    }


# ─────────────────────────────────────────
# 8. CATEGORY SALES SUMMARY
# ─────────────────────────────────────────

def get_category_sales_summary():
    """Sales summary grouped by category for last 30 days."""
    start = timezone.now() - timedelta(days=30)
    items = InvoiceItem.objects.filter(
        invoice__created_at__gte=start,
        invoice__status='PAID'
    ).select_related('product__category')

    category_data = {}
    for item in items:
        cat = item.product.category.name if item.product.category else 'Uncategorized'
        if cat not in category_data:
            category_data[cat] = {'total_qty': 0, 'total_revenue': 0}
        category_data[cat]['total_qty'] += item.quantity
        category_data[cat]['total_revenue'] += float(
            item.quantity * item.unit_price
        )

    return category_data