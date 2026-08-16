from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, F, Sum
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, Customer, Invoice, Product, StockMovement, Tenant
from .permissions import HasActiveTrialOrSubscription, resolve_tenant
from .serializers import (
    CategorySerializer,
    CustomerSerializer,
    InvoiceSerializer,
    ProductSerializer,
    StockMovementSerializer,
    SubscribeSerializer,
)


SUBSCRIPTION_PLANS = [
    {
        'id': Tenant.PLAN_TRIAL,
        'name': 'Free Trial',
        'price_nrs': 0,
        'billing_period': '3 days',
        'description': 'Full access for 3 days. No payment required.',
        'features': ['Invoices', 'Products', 'Customers', 'Stock alerts'],
        'subscribeable': False,
    },
    {
        'id': Tenant.PLAN_BASIC_MONTHLY,
        'name': 'Basic Monthly',
        'price_nrs': 999,
        'billing_period': 'month',
        'description': 'Ideal for small shops and startups.',
        'features': ['Unlimited invoices', 'Inventory', 'Customers', 'Email support'],
        'subscribeable': True,
    },
    {
        'id': Tenant.PLAN_PRO_YEARLY,
        'name': 'Pro Yearly',
        'price_nrs': 9999,
        'billing_period': 'year',
        'description': 'Best value for growing businesses.',
        'features': [
            'Everything in Basic',
            'AI insights',
            'Priority support',
            '2 months free vs monthly',
        ],
        'subscribeable': True,
    },
    {
        'id': Tenant.PLAN_ENTERPRISE,
        'name': 'Enterprise',
        'price_nrs': None,
        'billing_period': 'custom',
        'description': 'Custom pricing for multi-branch businesses.',
        'features': ['Custom integrations', 'Dedicated support', 'SLA'],
        'subscribeable': False,
    },
]


class TenantScopedViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasActiveTrialOrSubscription]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        resolve_tenant(request)

    def perform_create(self, serializer):
        tenant = resolve_tenant(self.request)
        serializer.save(tenant=tenant)


class CategoryViewSet(TenantScopedViewSet):
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.all().order_by('name')


class ProductViewSet(TenantScopedViewSet):
    serializer_class = ProductSerializer

    def get_queryset(self):
        return Product.objects.select_related('category').order_by('-updated_at')


class CustomerViewSet(TenantScopedViewSet):
    serializer_class = CustomerSerializer

    def get_queryset(self):
        return Customer.objects.all().order_by('-created_at')


class InvoiceViewSet(TenantScopedViewSet):
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        return Invoice.objects.select_related('customer').prefetch_related('items__product').order_by(
            '-created_at'
        )


class StockMovementViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated, HasActiveTrialOrSubscription]
    serializer_class = StockMovementSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        resolve_tenant(request)

    def get_queryset(self):
        return StockMovement.objects.select_related('product').order_by('-created_at')

    def perform_create(self, serializer):
        tenant = resolve_tenant(self.request)
        movement = serializer.save(tenant=tenant)
        product = movement.product
        if movement.movement_type == 'IN':
            product.stock_quantity += movement.quantity
        else:
            product.stock_quantity = max(0, product.stock_quantity - movement.quantity)
        product.save(update_fields=['stock_quantity'])


class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated, HasActiveTrialOrSubscription]

    def get(self, request):
        resolve_tenant(request)
        total_products = Product.objects.count()
        total_customers = Customer.objects.count()
        total_invoices = Invoice.objects.count()
        total_revenue = (
            Invoice.objects.filter(status='PAID').aggregate(total=Sum('total_amount'))['total']
            or Decimal('0')
        )
        low_stock = list(
            Product.objects.filter(stock_quantity__lte=F('low_stock_threshold')).values(
                'id', 'name', 'stock_quantity', 'low_stock_threshold'
            )[:10]
        )
        recent_invoices = InvoiceSerializer(
            Invoice.objects.select_related('customer').order_by('-created_at')[:5],
            many=True,
        ).data

        return Response(
            {
                'total_products': total_products,
                'total_customers': total_customers,
                'total_invoices': total_invoices,
                'total_revenue': total_revenue,
                'low_stock_products': low_stock,
                'recent_invoices': recent_invoices,
            }
        )


class SubscriptionPlansAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'plans': SUBSCRIPTION_PLANS})


class SubscribeAPIView(APIView):
    """Simulate Nepal local payment and activate the selected plan."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tenant = resolve_tenant(request)
        if tenant is None:
            return Response(
                {'detail': 'No store associated with this account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        plan = serializer.validated_data['plan']
        payment_method = serializer.validated_data['payment_method']
        now = timezone.now()

        if plan == Tenant.PLAN_BASIC_MONTHLY:
            ends_at = now + timedelta(days=30)
            price = 999
        elif plan == Tenant.PLAN_PRO_YEARLY:
            ends_at = now + timedelta(days=365)
            price = 9999
        else:
            ends_at = now + timedelta(days=365)
            price = None

        tenant.subscription_plan = plan
        tenant.subscription_status = Tenant.STATUS_ACTIVE
        tenant.subscription_ends_at = ends_at
        tenant.save(
            update_fields=[
                'subscription_plan',
                'subscription_status',
                'subscription_ends_at',
            ]
        )

        from accounts.serializers import TenantSubscriptionSerializer

        return Response(
            {
                'message': 'Subscription activated successfully.',
                'payment': {
                    'method': payment_method,
                    'amount_nrs': price,
                    'status': 'SUCCESS',
                    'simulated': True,
                },
                'tenant': TenantSubscriptionSerializer(tenant).data,
            }
        )
