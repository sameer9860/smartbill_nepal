"""
Admin-only REST API views for SmartBill Nepal.
All endpoints require IsAdminUser (is_staff=True).
"""
from datetime import timedelta

from django.contrib.auth.models import User
from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Invoice, SubscriptionReceipt, Tenant, UserProfile


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _tenant_dict(tenant: Tenant) -> dict:
    owner = (
        UserProfile.objects.filter(tenant=tenant)
        .select_related('user')
        .first()
    )
    return {
        'id': tenant.id,
        'name': tenant.name,
        'subscription_plan': tenant.subscription_plan,
        'subscription_status': tenant.subscription_status,
        'subscription_ends_at': tenant.subscription_ends_at,
        'trial_starts_at': tenant.trial_starts_at,
        'trial_ends_at': tenant.trial_ends_at,
        'created_at': tenant.created_at,
        'has_access': tenant.has_access(),
        'is_trial_active': tenant.is_trial_active(),
        'days_left_in_trial': tenant.days_left_in_trial(),
        'owner_username': owner.user.username if owner else None,
        'owner_email': owner.user.email if owner else None,
        'owner_id': owner.user.id if owner else None,
    }


def _receipt_dict(r: SubscriptionReceipt) -> dict:
    return {
        'id': r.id,
        'tenant_id': r.tenant_id,
        'tenant_name': r.tenant.name,
        'submitted_by_id': r.submitted_by_id,
        'submitted_by_username': r.submitted_by.username,
        'submitted_by_email': r.submitted_by.email,
        'plan': r.plan,
        'plan_display': r.get_plan_display(),
        'amount_nrs': str(r.amount_nrs),
        'status': r.status,
        'status_display': r.get_status_display(),
        'submitted_at': r.submitted_at,
        'reviewed_at': r.reviewed_at,
        'reviewed_by_username': r.reviewed_by.username if r.reviewed_by else None,
        'review_note': r.review_note,
        'receipt_url': r.receipt.url if r.receipt else None,
    }


# ---------------------------------------------------------------------------
# Dashboard overview
# ---------------------------------------------------------------------------

class AdminDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        now = timezone.now()
        total_tenants = Tenant.objects.count()
        active_tenants = Tenant.objects.filter(subscription_status='ACTIVE').count()
        trial_tenants = Tenant.objects.filter(subscription_status='TRIAL_ACTIVE').count()
        expired_tenants = Tenant.objects.filter(
            subscription_status__in=['EXPIRED', 'CANCELLED']
        ).count()

        pending_receipts = SubscriptionReceipt.objects.filter(status='PENDING').count()
        total_users = User.objects.count()

        # Revenue from approved receipts
        total_revenue = (
            SubscriptionReceipt.objects.filter(status='APPROVED')
            .aggregate(total=Sum('amount_nrs'))['total']
            or 0
        )

        # Monthly revenue (last 6 months)
        monthly_revenue = []
        for i in range(5, -1, -1):
            month_start = (now - timedelta(days=30 * i)).replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            month_end = (month_start + timedelta(days=32)).replace(day=1)
            rev = float(
                SubscriptionReceipt.objects.filter(
                    status='APPROVED',
                    reviewed_at__gte=month_start,
                    reviewed_at__lt=month_end,
                ).aggregate(total=Sum('amount_nrs'))['total']
                or 0
            )
            monthly_revenue.append({'month': month_start.strftime('%b %Y'), 'revenue': rev})

        # Plan distribution
        plan_dist = list(
            Tenant.objects.values('subscription_plan')
            .annotate(count=Count('id'))
            .order_by('subscription_plan')
        )

        # Recently joined tenants (last 5)
        recent_tenants = [
            _tenant_dict(t)
            for t in Tenant.objects.order_by('-created_at')[:5]
        ]

        # Recent pending receipts (top 5)
        recent_pending = [
            _receipt_dict(r)
            for r in SubscriptionReceipt.objects.filter(status='PENDING')
            .select_related('tenant', 'submitted_by')
            .order_by('-submitted_at')[:5]
        ]

        # Tenants expiring in 7 days
        expiring_soon = Tenant.objects.filter(
            subscription_status='ACTIVE',
            subscription_ends_at__gte=now,
            subscription_ends_at__lte=now + timedelta(days=7),
        ).count()

        return Response({
            'total_tenants': total_tenants,
            'active_tenants': active_tenants,
            'trial_tenants': trial_tenants,
            'expired_tenants': expired_tenants,
            'pending_receipts': pending_receipts,
            'total_users': total_users,
            'total_revenue_nrs': float(total_revenue),
            'monthly_revenue': monthly_revenue,
            'plan_distribution': plan_dist,
            'recent_tenants': recent_tenants,
            'recent_pending_receipts': recent_pending,
            'expiring_soon_count': expiring_soon,
        })


# ---------------------------------------------------------------------------
# Tenants management
# ---------------------------------------------------------------------------

class AdminTenantsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        qs = Tenant.objects.order_by('-created_at')

        # Filtering
        status_filter = request.query_params.get('status')
        plan_filter = request.query_params.get('plan')
        search = request.query_params.get('search', '').strip()

        if status_filter:
            qs = qs.filter(subscription_status=status_filter)
        if plan_filter:
            qs = qs.filter(subscription_plan=plan_filter)
        if search:
            qs = qs.filter(name__icontains=search)

        tenants = [_tenant_dict(t) for t in qs]
        return Response({'tenants': tenants, 'total': len(tenants)})


class AdminTenantDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, tenant_id):
        try:
            tenant = Tenant.objects.get(pk=tenant_id)
        except Tenant.DoesNotExist:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)

        receipts = [
            _receipt_dict(r)
            for r in SubscriptionReceipt.objects.filter(tenant=tenant)
            .select_related('submitted_by', 'reviewed_by')
            .order_by('-submitted_at')
        ]

        data = _tenant_dict(tenant)
        data['receipts'] = receipts
        return Response(data)

    def patch(self, request, tenant_id):
        """Manually override tenant plan / status / expiry."""
        try:
            tenant = Tenant.objects.get(pk=tenant_id)
        except Tenant.DoesNotExist:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)

        allowed_plans = [c[0] for c in Tenant.PLAN_CHOICES]
        allowed_statuses = [c[0] for c in Tenant.STATUS_CHOICES]

        update_fields = []

        if 'subscription_plan' in request.data:
            plan = request.data['subscription_plan']
            if plan not in allowed_plans:
                return Response(
                    {'detail': f'Invalid plan. Choices: {allowed_plans}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            tenant.subscription_plan = plan
            update_fields.append('subscription_plan')

        if 'subscription_status' in request.data:
            st = request.data['subscription_status']
            if st not in allowed_statuses:
                return Response(
                    {'detail': f'Invalid status. Choices: {allowed_statuses}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            tenant.subscription_status = st
            update_fields.append('subscription_status')

        if 'subscription_ends_at' in request.data:
            ends_at = request.data['subscription_ends_at']
            tenant.subscription_ends_at = ends_at or None
            update_fields.append('subscription_ends_at')

        if 'name' in request.data:
            tenant.name = request.data['name']
            update_fields.append('name')

        if update_fields:
            tenant.save(update_fields=update_fields)

        return Response(_tenant_dict(tenant))


# ---------------------------------------------------------------------------
# Subscription receipts
# ---------------------------------------------------------------------------

class AdminReceiptsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        qs = SubscriptionReceipt.objects.select_related(
            'tenant', 'submitted_by', 'reviewed_by'
        ).order_by('-submitted_at')

        status_filter = request.query_params.get('status')
        plan_filter = request.query_params.get('plan')
        search = request.query_params.get('search', '').strip()

        if status_filter:
            qs = qs.filter(status=status_filter)
        if plan_filter:
            qs = qs.filter(plan=plan_filter)
        if search:
            qs = qs.filter(
                Q(tenant__name__icontains=search) |
                Q(submitted_by__username__icontains=search)
            )

        receipts = [_receipt_dict(r) for r in qs]
        return Response({'receipts': receipts, 'total': len(receipts)})


class AdminReceiptDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def _get_receipt(self, receipt_id):
        try:
            return SubscriptionReceipt.objects.select_related(
                'tenant', 'submitted_by', 'reviewed_by'
            ).get(pk=receipt_id)
        except SubscriptionReceipt.DoesNotExist:
            return None

    def get(self, request, receipt_id):
        r = self._get_receipt(receipt_id)
        if not r:
            return Response({'detail': 'Receipt not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(_receipt_dict(r))

    def post(self, request, receipt_id):
        """Approve or reject a receipt. Body: {action: 'approve'|'reject', note: '...'}"""
        r = self._get_receipt(receipt_id)
        if not r:
            return Response({'detail': 'Receipt not found.'}, status=status.HTTP_404_NOT_FOUND)

        if r.status != SubscriptionReceipt.STATUS_PENDING:
            return Response(
                {'detail': f'Receipt is already {r.status.lower()}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        action = request.data.get('action', '').lower()
        note = request.data.get('note', '')

        if action not in ('approve', 'reject'):
            return Response(
                {'detail': 'action must be "approve" or "reject".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()

        if action == 'approve':
            tenant = r.tenant
            start = (
                tenant.subscription_ends_at
                if tenant.is_subscription_valid() and tenant.subscription_ends_at
                else now
            )
            duration = 30 if r.plan == Tenant.PLAN_BASIC_MONTHLY else 365
            tenant.subscription_plan = r.plan
            tenant.subscription_status = Tenant.STATUS_ACTIVE
            tenant.subscription_ends_at = start + timedelta(days=duration)
            tenant.save(update_fields=[
                'subscription_plan', 'subscription_status', 'subscription_ends_at'
            ])
            r.status = SubscriptionReceipt.STATUS_APPROVED
        else:
            r.status = SubscriptionReceipt.STATUS_REJECTED

        r.reviewed_at = now
        r.reviewed_by = request.user
        r.review_note = note
        r.save(update_fields=['status', 'reviewed_at', 'reviewed_by', 'review_note'])

        return Response(_receipt_dict(r))


# ---------------------------------------------------------------------------
# Users management
# ---------------------------------------------------------------------------

class AdminUsersAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        search = request.query_params.get('search', '').strip()
        qs = User.objects.select_related('profile__tenant').order_by('-date_joined')
        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        users = []
        for u in qs:
            profile = getattr(u, 'profile', None)
            tenant = profile.tenant if profile else None
            users.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'is_staff': u.is_staff,
                'is_active': u.is_active,
                'date_joined': u.date_joined,
                'last_login': u.last_login,
                'tenant_id': tenant.id if tenant else None,
                'tenant_name': tenant.name if tenant else None,
                'subscription_plan': tenant.subscription_plan if tenant else None,
                'subscription_status': tenant.subscription_status if tenant else None,
            })

        return Response({'users': users, 'total': len(users)})


class AdminUserDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, user_id):
        """Toggle is_active / is_staff for a user."""
        try:
            u = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if u.pk == request.user.pk:
            return Response(
                {'detail': 'You cannot modify your own account via this endpoint.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        update_fields = []
        if 'is_active' in request.data:
            u.is_active = bool(request.data['is_active'])
            update_fields.append('is_active')
        if 'is_staff' in request.data:
            u.is_staff = bool(request.data['is_staff'])
            update_fields.append('is_staff')

        if update_fields:
            u.save(update_fields=update_fields)

        return Response({'id': u.id, 'is_active': u.is_active, 'is_staff': u.is_staff})

