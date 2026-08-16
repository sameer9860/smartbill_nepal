from rest_framework import serializers

from .models import Category, Customer, Invoice, InvoiceItem, Product, StockMovement


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)

    class Meta:
        model = Product
        fields = [
            'id',
            'category',
            'category_name',
            'name',
            'description',
            'price',
            'stock_quantity',
            'low_stock_threshold',
            'is_low_stock',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_low_stock', 'category_name']


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id',
            'full_name',
            'email',
            'phone',
            'address',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class InvoiceItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = InvoiceItem
        fields = [
            'id',
            'product',
            'product_name',
            'quantity',
            'unit_price',
            'subtotal',
        ]
        read_only_fields = ['id', 'product_name', 'subtotal']


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, required=False)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    discount_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    tax_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    grand_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id',
            'customer',
            'customer_name',
            'invoice_number',
            'status',
            'total_amount',
            'discount',
            'tax',
            'notes',
            'items',
            'discount_amount',
            'tax_amount',
            'grand_total',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'invoice_number',
            'total_amount',
            'customer_name',
            'discount_amount',
            'tax_amount',
            'grand_total',
            'created_at',
            'updated_at',
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        invoice = Invoice.objects.create(**validated_data)
        total = 0
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            unit_price = item_data.get('unit_price', product.price)
            InvoiceItem.objects.create(
                invoice=invoice,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
            )
            total += quantity * unit_price
            # Reduce stock
            product.stock_quantity = max(0, product.stock_quantity - quantity)
            product.save(update_fields=['stock_quantity'])
            StockMovement.objects.create(
                tenant=invoice.tenant,
                product=product,
                movement_type='OUT',
                quantity=quantity,
                reason=f'Invoice {invoice.invoice_number}',
            )
        invoice.total_amount = total
        invoice.save(update_fields=['total_amount'])
        return invoice


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'id',
            'product',
            'product_name',
            'movement_type',
            'quantity',
            'reason',
            'created_at',
        ]
        read_only_fields = ['id', 'product_name', 'created_at']


class SubscribeSerializer(serializers.Serializer):
    PLAN_CHOICES = [
        ('BASIC_MONTHLY', 'Basic Monthly'),
        ('PRO_YEARLY', 'Pro Yearly'),
        ('ENTERPRISE', 'Enterprise'),
    ]
    PAYMENT_METHODS = [
        ('ESEWA', 'eSewa'),
        ('KHALTI', 'Khalti'),
        ('FONEPAY', 'Fonepay'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('SIMULATED', 'Simulated'),
    ]

    plan = serializers.ChoiceField(choices=PLAN_CHOICES)
    payment_method = serializers.ChoiceField(choices=PAYMENT_METHODS, default='SIMULATED')
