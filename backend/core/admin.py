from django.contrib import admin
from .models import Category, Product, Customer, Invoice, InvoiceItem, StockMovement


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'stock_quantity', 'is_low_stock']
    list_filter = ['category']
    search_fields = ['name']


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'phone', 'email', 'created_at']
    search_fields = ['full_name', 'phone']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'customer', 'total_amount', 'status', 'created_at']
    list_filter = ['status']


@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'product', 'quantity', 'unit_price', 'subtotal']


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['product', 'movement_type', 'quantity', 'created_at']
