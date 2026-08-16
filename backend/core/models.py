from datetime import timedelta

from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from .utils import generate_invoice_number
from django.db.models.signals import post_save
from django.dispatch import receiver


def default_trial_ends_at():
    return timezone.now() + timedelta(days=3)


# Tenant (Store) Model
class Tenant(models.Model):
    PLAN_TRIAL = 'TRIAL'
    PLAN_BASIC_MONTHLY = 'BASIC_MONTHLY'
    PLAN_PRO_YEARLY = 'PRO_YEARLY'
    PLAN_ENTERPRISE = 'ENTERPRISE'
    PLAN_CHOICES = [
        (PLAN_TRIAL, 'Free Trial'),
        (PLAN_BASIC_MONTHLY, 'Basic Monthly'),
        (PLAN_PRO_YEARLY, 'Pro Yearly'),
        (PLAN_ENTERPRISE, 'Enterprise'),
    ]

    STATUS_TRIAL_ACTIVE = 'TRIAL_ACTIVE'
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_EXPIRED = 'EXPIRED'
    STATUS_CANCELLED = 'CANCELLED'
    STATUS_CHOICES = [
        (STATUS_TRIAL_ACTIVE, 'Trial Active'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_EXPIRED, 'Expired'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    trial_starts_at = models.DateTimeField(default=timezone.now)
    trial_ends_at = models.DateTimeField(default=default_trial_ends_at)
    subscription_plan = models.CharField(
        max_length=32,
        choices=PLAN_CHOICES,
        default=PLAN_TRIAL,
    )
    subscription_status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default=STATUS_TRIAL_ACTIVE,
    )
    subscription_ends_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

    def is_trial_active(self):
        if self.subscription_status != self.STATUS_TRIAL_ACTIVE:
            return False
        return timezone.now() < self.trial_ends_at

    def is_subscription_valid(self):
        if self.subscription_status == self.STATUS_ACTIVE:
            if self.subscription_ends_at is None:
                return True
            return timezone.now() < self.subscription_ends_at
        return False

    def has_access(self):
        return self.is_trial_active() or self.is_subscription_valid()

    def days_left_in_trial(self):
        if not self.is_trial_active():
            return 0
        remaining = self.trial_ends_at - timezone.now()
        return max(0, remaining.days + (1 if remaining.seconds > 0 else 0))

    def sync_expiry_status(self):
        """Mark tenant expired when trial/subscription windows have passed."""
        if self.is_trial_active() or self.is_subscription_valid():
            return False
        if self.subscription_status in (self.STATUS_TRIAL_ACTIVE, self.STATUS_ACTIVE):
            self.subscription_status = self.STATUS_EXPIRED
            self.save(update_fields=['subscription_status'])
            return True
        return False


# User Profile Model
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    tenant = models.ForeignKey(Tenant, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


# Tenant Manager
class TenantManager(models.Manager):
    def get_queryset(self):
        from .utils import get_current_tenant
        tenant = get_current_tenant()
        if tenant:
            return super().get_queryset().filter(tenant=tenant)
        return super().get_queryset()


# Abstract Tenant Model Base Class
class TenantModel(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    
    objects = TenantManager()

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.tenant:
            from .utils import get_current_tenant
            self.tenant = get_current_tenant()
        super().save(*args, **kwargs)


# Category for products
class Category(TenantModel):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Categories'


# Product / Inventory
class Product(TenantModel):
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.low_stock_threshold


# Customer
class Customer(TenantModel):
    full_name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name


# Invoice (Bill)
class Invoice(TenantModel):
    STATUS_CHOICES = [
        ('PAID', 'Paid'),
        ('UNPAID', 'Unpaid'),
        ('PARTIAL', 'Partial'),
    ]

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE
    )
    invoice_number = models.CharField(
        max_length=50,
        blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='UNPAID'
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    discount = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0
    )
    tax = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=13
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['tenant', 'invoice_number'], name='unique_tenant_invoice_number')
        ]

    def __str__(self):
        return f"Invoice #{self.invoice_number} - {self.customer.full_name}"

    @property
    def discount_amount(self):
        return round(self.total_amount * self.discount / 100, 2)

    @property
    def tax_amount(self):
        return round(self.total_amount * self.tax / 100, 2)

    @property
    def grand_total(self):
        return round(
            self.total_amount - self.discount_amount + self.tax_amount, 2
        )

    def save(self, *args, **kwargs):
        # Auto-assign tenant if missing
        if not self.tenant:
            from .utils import get_current_tenant
            self.tenant = get_current_tenant()
        # Generate invoice number before saving if not already set
        if not self.invoice_number:
            self.invoice_number = generate_invoice_number(tenant=self.tenant)
        super().save(*args, **kwargs)


class InvoiceItemManager(models.Manager):
    def get_queryset(self):
        from .utils import get_current_tenant
        tenant = get_current_tenant()
        if tenant:
            return super().get_queryset().filter(invoice__tenant=tenant)
        return super().get_queryset()


# Invoice Line Items
class InvoiceItem(models.Model):
    objects = InvoiceItemManager()

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE
    )
    quantity = models.IntegerField()
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

    @property
    def subtotal(self):
        return self.quantity * self.unit_price


# Stock Movement Log
class StockMovement(TenantModel):
    MOVEMENT_TYPES = [
        ('IN', 'Stock In'),
        ('OUT', 'Stock Out'),
    ]

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE
    )
    movement_type = models.CharField(
        max_length=10,
        choices=MOVEMENT_TYPES
    )
    quantity = models.IntegerField()
    reason = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.movement_type} - {self.product.name} ({self.quantity})"


# Signals to auto-create profile and default tenant for new users


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        tenant = Tenant.objects.create(name=f"{instance.username}'s Store")
        UserProfile.objects.create(user=instance, tenant=tenant)