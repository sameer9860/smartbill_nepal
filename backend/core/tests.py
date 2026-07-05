from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from .models import Tenant, UserProfile, Category, Product, Customer, Invoice, InvoiceItem, StockMovement
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
