from django import forms
from .models import Category, Product, Customer, Invoice, InvoiceItem
from .utils import get_current_tenant


class CustomerChoiceField(forms.ModelChoiceField):
    """Show customer name and phone in the dropdown."""

    def label_from_instance(self, obj):
        if obj.phone and obj.phone != 'Walk-in':
            return f"{obj.full_name} — {obj.phone}"
        return obj.full_name


class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'e.g. Electronics, Grocery, Stationery',
                'autofocus': True,
            })
        }


class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = [
            'category', 'name', 'description',
            'price', 'stock_quantity', 'low_stock_threshold'
        ]
        widgets = {
            'category': forms.Select(attrs={'class': 'form-control'}),
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'price': forms.NumberInput(attrs={'class': 'form-control'}),
            'stock_quantity': forms.NumberInput(attrs={'class': 'form-control'}),
            'low_stock_threshold': forms.NumberInput(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        tenant = get_current_tenant()
        if tenant:
            self.fields['category'].queryset = Category.objects.filter(tenant=tenant)


class CustomerForm(forms.ModelForm):
    class Meta:
        model = Customer
        fields = ['full_name', 'email', 'phone', 'address']
        widgets = {
            'full_name': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'phone': forms.TextInput(attrs={'class': 'form-control'}),
            'address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }


class InvoiceForm(forms.ModelForm):
    # Walk-in customer fields
    customer_type = forms.ChoiceField(
        choices=[
            ('existing', 'Existing Customer'),
            ('walkin', 'Walk-in Customer'),
        ],
        widget=forms.RadioSelect(attrs={
            'class': 'form-check-input'
        }),
        initial='existing',
        required=True,
    )
    walkin_name = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter customer name',
        })
    )
    walkin_phone = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Phone number (optional)',
        })
    )

    customer = CustomerChoiceField(
        queryset=Customer.objects.none(),
        required=False,
        empty_label='-- Select Customer --',
        widget=forms.Select(attrs={'class': 'form-select'}),
    )

    class Meta:
        model = Invoice
        fields = [
            'customer_type',
            'walkin_name',
            'walkin_phone',
            'customer',
            'status',
            'discount',
            'tax',
            'notes'
        ]
        widgets = {
            'status': forms.Select(attrs={
                'class': 'form-control'
            }),
            'discount': forms.NumberInput(attrs={
                'class': 'form-control'
            }),
            'tax': forms.NumberInput(attrs={
                'class': 'form-control'
            }),
            'notes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2
            }),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['customer'].required = False
        self.fields['customer'].empty_label = '-- Select Customer --'
        queryset = Customer.objects.exclude(phone='Walk-in').order_by('full_name')
        tenant = get_current_tenant()
        if tenant:
            queryset = queryset.filter(tenant=tenant)
        self.fields['customer'].queryset = queryset

    def clean(self):
        cleaned_data = super().clean()
        customer_type = cleaned_data.get('customer_type')
        if customer_type == 'existing':
            if not cleaned_data.get('customer'):
                raise forms.ValidationError(
                    'Please select an existing customer.'
                )
        elif customer_type == 'walkin':
            if not cleaned_data.get('walkin_name'):
                raise forms.ValidationError(
                    'Please enter the walk-in customer name.'
                )
        return cleaned_data


class InvoiceItemForm(forms.ModelForm):
    class Meta:
        model = InvoiceItem
        fields = ['product', 'quantity', 'unit_price']
        widgets = {
            'product': forms.Select(attrs={'class': 'form-control'}),
            'quantity': forms.NumberInput(attrs={'class': 'form-control'}),
            'unit_price': forms.NumberInput(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        tenant = get_current_tenant()
        if tenant:
            # Only show this tenant's products in the dropdown
            self.fields['product'].queryset = Product.objects.filter(tenant=tenant)


# Formset for multiple invoice items
InvoiceItemFormSet = forms.inlineformset_factory(
    Invoice,
    InvoiceItem,
    form=InvoiceItemForm,
    extra=3,
    can_delete=True
)