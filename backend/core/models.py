from django.db import models
from django.utils import timezone
from .utils import generate_invoice_number


# Category for products
class Category(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Categories'


# Product / Inventory
class Product(models.Model):
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
class Customer(models.Model):
    full_name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name


# Invoice (Bill)
class Invoice(models.Model):
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
        unique=True,
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
        default=13  # Nepal VAT 13%
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Invoice #{self.invoice_number} - {self.customer.full_name}"

    @property
    def grand_total(self):
        tax_amount = self.total_amount * self.tax / 100
        discount_amount = self.total_amount * self.discount / 100
        return self.total_amount + tax_amount - discount_amount

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.invoice_number:
            self.invoice_number = generate_invoice_number(self.pk)
            super().save(*args, **kwargs)


# Invoice Line Items
class InvoiceItem(models.Model):
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
class StockMovement(models.Model):
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