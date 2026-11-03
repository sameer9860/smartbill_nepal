from datetime import timedelta

from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.urls import path, reverse
from django.utils.html import format_html
from django.utils import timezone

from .models import (
    Category,
    Customer,
    Invoice,
    InvoiceItem,
    Product,
    StockMovement,
    SubscriptionReceipt,
)


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


@admin.register(SubscriptionReceipt)
class SubscriptionReceiptAdmin(admin.ModelAdmin):
    list_display = [
        'tenant',
        'submitted_by',
        'plan',
        'amount_nrs',
        'status',
        'submitted_at',
    ]
    list_filter = ['status', 'plan', 'submitted_at']
    search_fields = ['tenant__name', 'submitted_by__username', 'submitted_by__email']
    readonly_fields = [
        'tenant',
        'submitted_by',
        'plan',
        'amount_nrs',
        'receipt_download',
        'status',
        'submitted_at',
        'reviewed_at',
        'reviewed_by',
    ]
    actions = ['approve_receipts', 'reject_receipts']

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:receipt_id>/download/',
                self.admin_site.admin_view(self.download_receipt),
                name='core_subscriptionreceipt_download',
            ),
        ]
        return custom_urls + urls

    def download_receipt(self, request, receipt_id):
        receipt = get_object_or_404(SubscriptionReceipt, pk=receipt_id)
        if not self.has_view_or_change_permission(request, receipt):
            raise PermissionDenied
        return FileResponse(
            receipt.receipt.open('rb'),
            as_attachment=True,
            filename=receipt.receipt.name.rsplit('/', 1)[-1],
        )

    @admin.display(description='Uploaded receipt')
    def receipt_download(self, obj):
        if not obj or not obj.pk:
            return 'No receipt uploaded'
        url = reverse('admin:core_subscriptionreceipt_download', args=[obj.pk])
        return format_html('<a href="{}">Download receipt</a>', url)

    @admin.action(description='Approve selected receipts and activate subscriptions')
    def approve_receipts(self, request, queryset):
        approved = 0
        for receipt in queryset.select_related('tenant'):
            if receipt.status != SubscriptionReceipt.STATUS_PENDING:
                continue

            now = timezone.now()
            tenant = receipt.tenant
            start = (
                tenant.subscription_ends_at
                if tenant.is_subscription_valid() and tenant.subscription_ends_at
                else now
            )
            duration = 30 if receipt.plan == 'BASIC_MONTHLY' else 365
            tenant.subscription_plan = receipt.plan
            tenant.subscription_status = tenant.STATUS_ACTIVE
            tenant.subscription_ends_at = start + timedelta(days=duration)
            tenant.save(
                update_fields=[
                    'subscription_plan',
                    'subscription_status',
                    'subscription_ends_at',
                ]
            )
            receipt.status = SubscriptionReceipt.STATUS_APPROVED
            receipt.reviewed_at = now
            receipt.reviewed_by = request.user
            receipt.save(update_fields=['status', 'reviewed_at', 'reviewed_by'])
            approved += 1

        self.message_user(
            request,
            f'{approved} subscription receipt(s) approved.',
            messages.SUCCESS,
        )

    @admin.action(description='Reject selected receipts')
    def reject_receipts(self, request, queryset):
        rejected = queryset.filter(status=SubscriptionReceipt.STATUS_PENDING).update(
            status=SubscriptionReceipt.STATUS_REJECTED,
            reviewed_at=timezone.now(),
            reviewed_by=request.user,
        )
        self.message_user(
            request,
            f'{rejected} subscription receipt(s) rejected.',
            messages.WARNING,
        )
