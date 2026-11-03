import tempfile

from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.messages.storage.fallback import FallbackStorage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory, TestCase, override_settings
from django.contrib.sessions.backends.db import SessionStore
from rest_framework.test import APIClient

from .admin import SubscriptionReceiptAdmin
from .models import (
    Category,
    Customer,
    Invoice,
    InvoiceItem,
    Product,
    StockMovement,
    SubscriptionReceipt,
    Tenant,
    UserProfile,
)
from .utils import set_current_tenant


class TenantIsolationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tenantuser', password='pass1234')
        self.tenant_a = Tenant.objects.create(name='Store A')
        self.tenant_b = Tenant.objects.create(name='Store B')
        self.profile_a, _ = UserProfile.objects.get_or_create(
            user=self.user,
            defaults={'tenant': self.tenant_a},
        )
        self.profile_a.tenant = self.tenant_a
        self.profile_a.save(update_fields=['tenant'])

    def tearDown(self):
        set_current_tenant(None)

    def _set_tenant(self, tenant):
        set_current_tenant(tenant)

    def test_manager_scopes_queryset_to_current_tenant(self):
        self._set_tenant(self.tenant_a)
        Category.objects.create(name='A Category')

        self._set_tenant(self.tenant_b)
        Category.objects.create(name='B Category')

        self._set_tenant(self.tenant_a)
        self.assertEqual(Category.objects.count(), 1)
        self.assertEqual(Category.objects.get().name, 'A Category')

    def test_invoice_items_are_scoped_by_tenant_via_invoice(self):
        self._set_tenant(self.tenant_a)
        customer_a = Customer.objects.create(full_name='Alice', phone='111')
        invoice_a = Invoice.objects.create(customer=customer_a, status='PAID', total_amount=10)
        product_a = Product.objects.create(name='Product A', price=1, stock_quantity=10)
        InvoiceItem.objects.create(invoice=invoice_a, product=product_a, quantity=1, unit_price=1)

        self._set_tenant(self.tenant_b)
        customer_b = Customer.objects.create(full_name='Bob', phone='222')
        invoice_b = Invoice.objects.create(customer=customer_b, status='PAID', total_amount=20)
        product_b = Product.objects.create(name='Product B', price=2, stock_quantity=10)
        InvoiceItem.objects.create(invoice=invoice_b, product=product_b, quantity=1, unit_price=2)

        self._set_tenant(self.tenant_a)
        self.assertEqual(InvoiceItem.objects.count(), 1)


class SubscriptionReceiptTests(TestCase):
    def setUp(self):
        self.media_dir = tempfile.TemporaryDirectory()
        media_settings = override_settings(MEDIA_ROOT=self.media_dir.name)
        media_settings.enable()
        self.addCleanup(media_settings.disable)
        self.addCleanup(self.media_dir.cleanup)

        self.user = User.objects.create_user(username='billinguser', password='pass1234')
        self.tenant = self.user.profile.tenant
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_receipt_stays_pending_until_admin_approval(self):
        response = self.client.post(
            '/api/subscription/receipt/',
            {
                'plan': Tenant.PLAN_BASIC_MONTHLY,
                'receipt': SimpleUploadedFile(
                    'payment.pdf', b'%PDF-1.4 payment proof', content_type='application/pdf'
                ),
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, 201)
        receipt = SubscriptionReceipt.objects.get(pk=response.data['id'])
        self.assertEqual(receipt.status, SubscriptionReceipt.STATUS_PENDING)
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.subscription_status, Tenant.STATUS_TRIAL_ACTIVE)

        admin_user = User.objects.create_superuser(
            username='billingadmin', email='admin@example.com', password='pass1234'
        )
        request = RequestFactory().post('/admin/')
        request.user = admin_user
        request.session = SessionStore()
        request._messages = FallbackStorage(request)
        receipt_admin = SubscriptionReceiptAdmin(SubscriptionReceipt, admin.site)
        receipt_admin.approve_receipts(
            request,
            SubscriptionReceipt.objects.filter(pk=receipt.pk),
        )

        receipt.refresh_from_db()
        self.tenant.refresh_from_db()
        self.assertEqual(receipt.status, SubscriptionReceipt.STATUS_APPROVED)
        self.assertEqual(self.tenant.subscription_status, Tenant.STATUS_ACTIVE)
        self.assertEqual(self.tenant.subscription_plan, Tenant.PLAN_BASIC_MONTHLY)

    def test_legacy_subscribe_endpoint_does_not_activate_a_plan(self):
        response = self.client.post(
            '/api/subscription/subscribe/',
            {'plan': Tenant.PLAN_BASIC_MONTHLY, 'payment_method': 'SIMULATED'},
            format='json',
        )

        self.assertEqual(response.status_code, 410)
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.subscription_status, Tenant.STATUS_TRIAL_ACTIVE)

    def test_reports_endpoint_returns_monthly_revenue(self):
        response = self.client.get('/api/reports/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['monthly_revenue']), 6)
