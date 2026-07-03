from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.db.models import Sum, Count, Q, ExpressionWrapper, DecimalField, F, F as F_expr
from django.utils import timezone
from datetime import timedelta
from .models import Product, Customer, Invoice, InvoiceItem, StockMovement, Category
from .forms import ProductForm, CustomerForm, InvoiceForm, InvoiceItemFormSet
import json


# DASHBOARD
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


# PRODUCTS
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


def product_delete(request, pk):
    product = get_object_or_404(Product, pk=pk)
    if request.method == 'POST':
        name = product.name
        product.delete()
        messages.success(request, f'Product "{name}" deleted!')
        return redirect('product_list')
    return render(request, 'core/confirm_delete.html', {'object': product})


# CUSTOMERS
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
def invoice_list(request):
    invoices = Invoice.objects.select_related('customer').order_by('-created_at')
    return render(request, 'core/invoice_list.html', {'invoices': invoices})


def invoice_create(request):
    if request.method == 'POST':
        form = InvoiceForm(request.POST)
        formset = InvoiceItemFormSet(request.POST)
        if form.is_valid() and formset.is_valid():
            invoice = form.save(commit=False)
            invoice.save()
            items = formset.save(commit=False)
            total = 0
            for item in items:
                item.invoice = invoice
                item.save()
                total += item.subtotal
                # Deduct stock
                product = item.product
                product.stock_quantity -= item.quantity
                product.save()
                # Log stock movement
                StockMovement.objects.create(
                    product=product,
                    movement_type='OUT',
                    quantity=item.quantity,
                    reason=f'Invoice #{invoice.invoice_number}'
                )
            # Update total amount
            invoice.total_amount = total
            invoice.save()
            messages.success(request, f'Invoice #{invoice.invoice_number} created!')
            return redirect('invoice_detail', pk=invoice.pk)
    else:
        form = InvoiceForm()
        formset = InvoiceItemFormSet()
    return render(request, 'core/invoice_form.html', {
        'form': form,
        'formset': formset
    })


def invoice_detail(request, pk):
    invoice = get_object_or_404(
        Invoice.objects.select_related('customer').prefetch_related('items__product'),
        pk=pk
    )
    return render(request, 'core/invoice_detail.html', {'invoice': invoice})


def invoice_print(request, pk):
    invoice = get_object_or_404(
        Invoice.objects.select_related('customer').prefetch_related('items__product'),
        pk=pk
    )
    return render(request, 'core/invoice_print.html', {'invoice': invoice})


# LOW STOCK ALERTS
def low_stock_alerts(request):
    low_stock = Product.objects.filter(
        stock_quantity__lte=F('low_stock_threshold')
    ).select_related('category')
    return render(request, 'core/low_stock.html', {'products': low_stock})


# REPORTS
def reports(request):
    # Top selling products
    revenue_expr = ExpressionWrapper(
        F_expr('unit_price') * F_expr('quantity'),
        output_field=DecimalField(max_digits=12, decimal_places=2)
    )
    top_products = InvoiceItem.objects.values(
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