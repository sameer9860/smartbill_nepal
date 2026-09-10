from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, DecimalField, ExpressionWrapper, F, Sum
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .ai import (
    abc_analysis,
    business_health_score,
    detect_trends,
    forecast_sales,
    get_category_sales_summary,
    predict_low_stock,
    smart_reorder_plan,
    weekly_order_list,
)
from .models import Category, Customer, Invoice, InvoiceItem, Product, StockMovement, Tenant
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


class ReportsAPIView(APIView):
    permission_classes = [IsAuthenticated, HasActiveTrialOrSubscription]

    def get(self, request):
        resolve_tenant(request)

        revenue_expr = ExpressionWrapper(
            F('unit_price') * F('quantity'),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )
        top_products = list(
            InvoiceItem.objects.values('product__name')
            .annotate(
                total_qty=Sum('quantity'),
                total_revenue=Sum(revenue_expr),
            )
            .order_by('-total_qty')[:10]
        )

        status_data = list(
            Invoice.objects.values('status').annotate(
                count=Count('id'),
                total=Sum('total_amount'),
            )
        )

        total_revenue = float(
            Invoice.objects.filter(status='PAID').aggregate(total=Sum('total_amount'))['total']
            or 0
        )

        monthly_data = []
        for i in range(5, -1, -1):
            month_start = (timezone.now() - timedelta(days=30 * i)).replace(
                day=1, hour=0, minute=0, second=0
            )
            month_end = (month_start + timedelta(days=32)).replace(day=1)
            rev = float(
                Invoice.objects.filter(
                    created_at__gte=month_start,
                    created_at__lt=month_end,
                    status='PAID',
                ).aggregate(total=Sum('total_amount'))['total']
                or 0
            )
            monthly_data.append({'month': month_start.strftime('%b %Y'), 'revenue': rev})

        return Response(
            {
                'top_products': [
                    {
                        'name': p['product__name'],
                        'total_qty': p['total_qty'],
                        'total_revenue': float(p['total_revenue'] or 0),
                    }
                    for p in top_products
                ],
                'status_breakdown': [
                    {
                        'status': s['status'],
                        'count': s['count'],
                        'total': float(s['total'] or 0),
                    }
                    for s in status_data
                ],
                'total_revenue': total_revenue,
                'monthly_revenue': monthly_data,
            }
        )


class AIInsightsAPIView(APIView):
    permission_classes = [IsAuthenticated, HasActiveTrialOrSubscription]

    def get(self, request):
        resolve_tenant(request)

        health = business_health_score()
        forecast = forecast_sales(days_ahead=30)
        abc = abc_analysis()
        trends_raw = detect_trends()
        stock_risk = predict_low_stock()
        reorder = smart_reorder_plan()
        weekly = weekly_order_list()
        category_summary = get_category_sales_summary()

        abc_items = abc.get('all') or (abc.get('A', []) + abc.get('B', []) + abc.get('C', []))

        return Response(
            {
                'health': health,
                'forecast': forecast,
                'abc': {
                    'items': [
                        {
                            'product_name': item['product'].name,
                            'revenue': item['revenue'],
                            'qty_sold': item['qty_sold'],
                            'abc_class': item['class'],
                            'revenue_pct': item.get('revenue_pct', 0),
                            'cumulative_pct': item.get('cumulative_pct', 0),
                        }
                        for item in abc_items
                    ],
                    'total_revenue': abc.get('total_revenue', 0),
                    'a_revenue': abc.get('a_revenue', 0),
                    'b_revenue': abc.get('b_revenue', 0),
                    'c_revenue': abc.get('c_revenue', 0),
                    'a_count': abc.get('a_count', 0),
                    'b_count': abc.get('b_count', 0),
                    'c_count': abc.get('c_count', 0),
                },
                'trends': [
                    {
                        'product_name': t['product'].name,
                        'recent_7d': t['recent_7d'],
                        'previous_7d': t['previous_7d'],
                        'change_pct': t['change_pct'],
                        'trend': t['trend'],
                    }
                    for t in trends_raw
                ],
                'stock_risk': [
                    {
                        'product_name': r['product'].name,
                        'stock_quantity': r['product'].stock_quantity,
                        'avg_daily_sales': r['avg_daily_sales'],
                        'days_until_stockout': r['days_until_stockout'],
                        'risk': r['risk'],
                        'recommended_restock': r['recommended_restock'],
                    }
                    for r in stock_risk
                ],
                'reorder_plan': [
                    {
                        'product_name': r['product'].name,
                        'avg_daily_sales': r['avg_daily_sales'],
                        'safety_stock': r['safety_stock'],
                        'reorder_point': r['reorder_point'],
                        'current_stock': r['current_stock'],
                        'order_qty': r['order_qty'],
                        'estimated_cost': r['estimated_cost'],
                        'needs_order_now': r['needs_order_now'],
                    }
                    for r in reorder
                ],
                'weekly_orders': {
                    'items': [
                        {
                            'product_name': w['product'].name,
                            'stock_quantity': w['current_stock'],
                            'reorder_point': w['reorder_point'],
                            'order_qty': w['order_qty'],
                            'estimated_cost': w['estimated_cost'],
                        }
                        for w in weekly.get('items', [])
                    ],
                    'total_items': weekly.get('total_items', 0),
                    'total_estimated_cost': weekly.get('total_estimated_cost', 0),
                },
                'category_summary': [
                    {
                        'category': cat,
                        'total_qty': data['total_qty'],
                        'total_revenue': data['total_revenue'],
                    }
                    for cat, data in category_summary.items()
                ],
            }
        )


class LowStockAPIView(APIView):
    permission_classes = [IsAuthenticated, HasActiveTrialOrSubscription]

    def get(self, request):
        resolve_tenant(request)
        products = (
            Product.objects.filter(stock_quantity__lte=F('low_stock_threshold'))
            .select_related('category')
            .order_by('stock_quantity')
        )
        return Response(ProductSerializer(products, many=True).data)
