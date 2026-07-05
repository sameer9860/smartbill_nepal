from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.db.models import Sum, Count, Q, ExpressionWrapper, DecimalField, F, F as F_expr
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.decorators import login_required
from .models import Product, Customer, Invoice, InvoiceItem, StockMovement, Category
from .forms import ProductForm, CustomerForm, InvoiceForm, InvoiceItemFormSet,CategoryForm
import json
from .ai import (
    predict_low_stock,
    forecast_sales,
    abc_analysis,
    detect_trends,
    business_health_score,
    smart_reorder_plan,
    weekly_order_list,
    get_category_sales_summary,
)
from django.urls import reverse


def handler404(request, exception):
    return render(request, 'core/404.html', status=404)

def handler500(request):
    return render(request, 'core/500.html', status=500)

# DASHBOARD
@login_required
def dashboard(request):
    # Summary stats
    total_products = Product.objects.count()
    total_customers = Customer.objects.count()
    total_invoices = Invoice.objects.count()
    total_revenue = Invoice.objects.filter(
        status='PAID'
    ).aggregate(
        total=Sum('total_amount')
    )['total'] or 0

    low_stock_products = Product.objects.filter(
        stock_quantity__lte=F('low_stock_threshold')
    )

    # Recent invoices
    recent_invoices = Invoice.objects.select_related(
        'customer'
    ).order_by('-created_at')[:5]

    # Monthly revenue for chart (last 6 months)
    monthly_data = []
    monthly_labels = []
    for i in range(5, -1, -1):
        month_start = (timezone.now() - timedelta(days=30 * i)).replace(
            day=1, hour=0, minute=0, second=0
        )
        month_end = (month_start + timedelta(days=32)).replace(day=1)
        revenue = Invoice.objects.filter(
            created_at__gte=month_start,
            created_at__lt=month_end,
            status='PAID'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        monthly_data.append(float(revenue))
        monthly_labels.append(month_start.strftime('%b %Y'))

    context = {
        'total_products': total_products,
        'total_customers': total_customers,
        'total_invoices': total_invoices,
        'total_revenue': total_revenue,
        'low_stock_products': low_stock_products,
        'recent_invoices': recent_invoices,
        'monthly_labels': json.dumps(monthly_labels),
        'monthly_data': json.dumps(monthly_data),
    }
    return render(request, 'core/dashboard.html', context)

# CATEGORIES
@login_required
def category_list(request):
    search = request.GET.get('search', '')
    categories = Category.objects.annotate(
        product_count=Count('product')
    ).all()
    if search:
        categories = categories.filter(
            name__icontains=search
        )
    return render(request, 'core/category_list.html', {
        'categories': categories,
        'search': search
    })


@login_required
def category_add(request):
    if request.method == 'POST':
        form = CategoryForm(request.POST)
        if form.is_valid():
            category = form.save()
            messages.success(
                request,
                f'Category "{category.name}" added successfully!'
            )
            return redirect('category_list')
    else:
        form = CategoryForm()

    existing_categories = Category.objects.annotate(
        product_count=Count('product')
    ).order_by('name')

    return render(request, 'core/category_form.html', {
        'form': form,
        'title': 'Add Category',
        'existing_categories': existing_categories,
    })


@login_required
def category_edit(request, pk):
    category = get_object_or_404(Category, pk=pk)
    if request.method == 'POST':
        form = CategoryForm(request.POST, instance=category)
        if form.is_valid():
            category = form.save()
            messages.success(
                request,
                f'Category "{category.name}" updated!'
            )
            return redirect('category_list')
    else:
        form = CategoryForm(instance=category)

    existing_categories = Category.objects.annotate(
        product_count=Count('product')
    ).exclude(pk=pk).order_by('name')

    return render(request, 'core/category_form.html', {
        'form': form,
        'title': f'Edit Category — {category.name}',
        'existing_categories': existing_categories,
    })


@login_required
def category_delete(request, pk):
    category = get_object_or_404(Category, pk=pk)
    if request.method == 'POST':
        product_count = category.product_count \
            if hasattr(category, 'product_count') \
            else category.product_set.count()
        name = category.name
        category.delete()
        messages.success(
            request,
            f'Category "{name}" deleted! '
            f'{product_count} products set to uncategorized.'
        )
        return redirect('category_list')
    return render(request, 'core/category_confirm_delete.html', {
        'category': category,
        'product_count': category.product_set.count()
    })

# PRODUCTS
@login_required
def product_list(request):
    search = request.GET.get('search', '')
    products = Product.objects.select_related('category').all()
    if search:
        products = products.filter(
            Q(name__icontains=search) |
            Q(category__name__icontains=search)
        )
    return render(request, 'core/product_list.html', {
        'products': products,
        'search': search
    })

@login_required
def product_add(request):
    if request.method == 'POST':
        form = ProductForm(request.POST)
        if form.is_valid():
            product = form.save()
            # Log stock movement
            StockMovement.objects.create(
                product=product,
                movement_type='IN',
                quantity=product.stock_quantity,
                reason='Initial stock'
            )
            messages.success(request, f'Product "{product.name}" added successfully!')
            return redirect('product_list')
    else:
        form = ProductForm()
    return render(request, 'core/product_form.html', {
        'form': form,
        'title': 'Add Product'
    })


@login_required
def product_edit(request, pk):
    product = get_object_or_404(Product, pk=pk)
    old_quantity = product.stock_quantity
    if request.method == 'POST':
        form = ProductForm(request.POST, instance=product)
        if form.is_valid():
            product = form.save()
            # Log stock movement if quantity changed
            new_quantity = product.stock_quantity
            if new_quantity != old_quantity:
                diff = new_quantity - old_quantity
                StockMovement.objects.create(
                    product=product,
                    movement_type='IN' if diff > 0 else 'OUT',
                    quantity=abs(diff),
                    reason='Stock adjustment'
                )
            messages.success(request, f'Product "{product.name}" updated!')
            return redirect('product_list')
    else:
        form = ProductForm(instance=product)
    return render(request, 'core/product_form.html', {
        'form': form,
        'title': 'Edit Product'
    })


@login_required
def product_delete(request, pk):
    product = get_object_or_404(Product, pk=pk)
    if request.method == 'POST':
        name = product.name
        product.delete()
        messages.success(request, f'Product "{name}" deleted!')
        return redirect('product_list')
    return render(request, 'core/confirm_delete.html', {
        'object': product,
        'cancel_url': reverse('product_list')
    })


# CUSTOMERS
@login_required
def customer_list(request):
    search = request.GET.get('search', '')
    customers = Customer.objects.all()
    if search:
        customers = customers.filter(
            Q(full_name__icontains=search) |
            Q(phone__icontains=search)
        )
    return render(request, 'core/customer_list.html', {
        'customers': customers,
        'search': search
    })

@login_required
def customer_add(request):
    if request.method == 'POST':
        form = CustomerForm(request.POST)
        if form.is_valid():
            customer = form.save()
            messages.success(request, f'Customer "{customer.full_name}" added!')
            return redirect('customer_list')
    else:
        form = CustomerForm()
    return render(request, 'core/customer_form.html', {
        'form': form,
        'title': 'Add Customer'
    })

@login_required
def customer_edit(request, pk):
    customer = get_object_or_404(Customer, pk=pk)
    if request.method == 'POST':
        form = CustomerForm(request.POST, instance=customer)
        if form.is_valid():
            customer = form.save()
            messages.success(request, f'Customer "{customer.full_name}" updated!')
            return redirect('customer_list')
    else:
        form = CustomerForm(instance=customer)
    return render(request, 'core/customer_form.html', {
        'form': form,
        'title': 'Edit Customer'
    })


# INVOICES
@login_required
def invoice_list(request):
    invoices = Invoice.objects.select_related('customer').order_by('-created_at')
    return render(request, 'core/invoice_list.html', {'invoices': invoices})

@login_required
def invoice_create(request):
    if request.method == 'POST':
        form = InvoiceForm(request.POST)
        formset = InvoiceItemFormSet(request.POST)

        if form.is_valid() and formset.is_valid():
            customer_type = form.cleaned_data.get('customer_type')

            # ── Handle Walk-in Customer
            if customer_type == 'walkin':
                walkin_name = form.cleaned_data.get('walkin_name').strip()
                walkin_phone = form.cleaned_data.get(
                    'walkin_phone', ''
                ).strip()

                # Check if customer with same name+phone already exists
                existing = None
                if walkin_phone:
                    existing = Customer.objects.filter(
                        full_name__iexact=walkin_name,
                        phone=walkin_phone
                    ).first()
                else:
                    existing = Customer.objects.filter(
                        full_name__iexact=walkin_name
                    ).first()

                if existing:
                    customer = existing
                    messages.info(
                        request,
                        f'Existing customer "{customer.full_name}" found and linked.'
                    )
                else:
                    customer = Customer.objects.create(
                        full_name=walkin_name,
                        phone=walkin_phone or 'Walk-in',
                    )
                    messages.info(
                        request,
                        f'New customer "{customer.full_name}" added to database.'
                    )
            else:
                customer = form.cleaned_data.get('customer')

            # ── Validate Stock
            errors = []
            for item_form in formset:
                if item_form.cleaned_data and not item_form.cleaned_data.get('DELETE'):
                    product = item_form.cleaned_data.get('product')
                    quantity = item_form.cleaned_data.get('quantity', 0)
                    if product and quantity > product.stock_quantity:
                        errors.append(
                            f'Not enough stock for "{product.name}". '
                            f'Available: {product.stock_quantity}, '
                            f'Requested: {quantity}'
                        )
            if errors:
                for error in errors:
                    messages.error(request, error)
                return render(request, 'core/invoice_form.html', {
                    'form': form,
                    'formset': formset,
                    'products': Product.objects.all(),
                    'customers_json': json.dumps({
                        str(c.pk): {
                            'name': c.full_name,
                            'phone': c.phone or '',
                            'email': c.email or '',
                            'avatar': c.full_name[0].upper() if c.full_name else '?',
                        }
                        for c in Customer.objects.exclude(phone='Walk-in')
                    }),
                })

            # ── Save Invoice
            invoice = form.save(commit=False)
            invoice.customer = customer
            invoice.save()

            items = formset.save(commit=False)
            total = 0
            for item in items:
                item.invoice = invoice
                item.save()
                total += item.subtotal
                product = item.product
                product.stock_quantity -= item.quantity
                product.save()
                StockMovement.objects.create(
                    product=product,
                    movement_type='OUT',
                    quantity=item.quantity,
                    reason=f'Invoice #{invoice.invoice_number}'
                )

            invoice.total_amount = total
            invoice.save()

            messages.success(
                request,
                f'Invoice #{invoice.invoice_number} created successfully!'
            )
            return redirect('invoice_detail', pk=invoice.pk)

    else:
        form = InvoiceForm()
        formset = InvoiceItemFormSet()

    customers_data = {
        str(c.pk): {
            'name': c.full_name,
            'phone': c.phone or '',
            'email': c.email or '',
            'avatar': c.full_name[0].upper() if c.full_name else '?',
        }
        for c in Customer.objects.exclude(phone='Walk-in')
    }

    return render(request, 'core/invoice_form.html', {
        'form': form,
        'formset': formset,
        'products': Product.objects.all(),
        'customers_json': json.dumps(customers_data),
    })


@login_required
def invoice_detail(request, pk):
    invoice = get_object_or_404(
        Invoice.objects.select_related('customer').prefetch_related('items__product'),
        pk=pk
    )
    return render(request, 'core/invoice_detail.html', {'invoice': invoice})

@login_required
def invoice_print(request, pk):
    invoice = get_object_or_404(
        Invoice.objects.select_related('customer').prefetch_related('items__product'),
        pk=pk
    )
    return render(request, 'core/invoice_print.html', {'invoice': invoice})


@login_required
def invoice_delete(request, pk):
    invoice = get_object_or_404(Invoice, pk=pk)
    if request.method == 'POST':
        invoice_number = invoice.invoice_number
        invoice.delete()
        messages.success(request, f'Invoice #{invoice_number} deleted!')
        return redirect('invoice_list')
    return render(request, 'core/confirm_delete.html', {
        'object': invoice,
        'cancel_url': reverse('invoice_list')
    })


# LOW STOCK ALERTS
@login_required
def low_stock_alerts(request):
    low_stock = Product.objects.filter(
        stock_quantity__lte=F('low_stock_threshold')
    ).select_related('category')
    return render(request, 'core/low_stock.html', {'products': low_stock})


# REPORTS
@login_required
def reports(request):
    # Top selling products
    revenue_expr = ExpressionWrapper(
        F_expr('unit_price') * F_expr('quantity'),
        output_field=DecimalField(max_digits=12, decimal_places=2)
    )
    top_products = InvoiceItem.objects.filter(
        invoice__tenant=request.tenant
    ).values(
        'product__name'
    ).annotate(
        total_qty=Sum('quantity'),
        total_revenue=Sum(revenue_expr)
    ).order_by('-total_qty')[:10]

    # Invoice status breakdown
    status_data = Invoice.objects.values('status').annotate(
        count=Count('id'),
        total=Sum('total_amount')
    )

    # Total revenue
    total_revenue = Invoice.objects.filter(
        status='PAID'
    ).aggregate(total=Sum('total_amount'))['total'] or 0

    context = {
        'top_products': top_products,
        'status_data': status_data,
        'total_revenue': total_revenue,
        'top_product_labels': json.dumps([p['product__name'] for p in top_products]),
        'top_product_data': json.dumps([float(p['total_revenue'] or 0) for p in top_products]),
    }
    return render(request, 'core/reports.html', context)

@login_required
def ai_dashboard(request):
    low_stock_predictions = predict_low_stock()
    forecast = forecast_sales(days_ahead=30)
    abc = abc_analysis()
    trends = detect_trends()
    health = business_health_score()
    reorder_plan = smart_reorder_plan()
    weekly_orders = weekly_order_list()
    category_summary = get_category_sales_summary()

    # ABC chart data
    abc_items = abc.get('all') or (abc.get('A', []) + abc.get('B', []) + abc.get('C', []))
    abc_labels = [p['product'].name for p in abc_items[:10]]
    abc_data = [p['revenue'] for p in abc_items[:10]]
    abc_colors = [
        '#1a237e' if p['class'] == 'A'
        else '#ff9800' if p['class'] == 'B'
        else '#9e9e9e'
        for p in abc_items[:10]
    ]

    # Trend chart data
    trend_labels = [t['product'].name for t in trends[:8]]
    trend_data = [t['change_pct'] for t in trends[:8]]
    trend_colors = [
        '#4caf50' if t['trend'] == 'UP'
        else '#f44336' if t['trend'] == 'DOWN'
        else '#ff9800'
        for t in trends[:8]
    ]

    # Category chart data
    cat_labels = list(category_summary.keys())
    cat_data = [v['total_revenue'] for v in category_summary.values()]

    context = {
        'low_stock_predictions': low_stock_predictions,
        'forecast': forecast,
        'abc': abc,
        'trends': trends,
        'health': health,
        'reorder_plan': reorder_plan,
        'weekly_orders': weekly_orders,
        'category_summary': category_summary,

        # Chart data
        'abc_labels': json.dumps(abc_labels),
        'abc_data': json.dumps(abc_data),
        'abc_colors': json.dumps(abc_colors),
        'trend_labels': json.dumps(trend_labels),
        'trend_data': json.dumps(trend_data),
        'trend_colors': json.dumps(trend_colors),
        'cat_labels': json.dumps(cat_labels),
        'cat_data': json.dumps(cat_data),
    }
    return render(request, 'core/ai_dashboard.html', context)