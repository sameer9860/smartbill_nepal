import re

from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import serializers

from core.models import Tenant, UserProfile


class TenantSubscriptionSerializer(serializers.ModelSerializer):
    is_trial_active = serializers.SerializerMethodField()
    is_subscription_valid = serializers.SerializerMethodField()
    has_access = serializers.SerializerMethodField()
    days_left_in_trial = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            'id',
            'name',
            'trial_starts_at',
            'trial_ends_at',
            'subscription_plan',
            'subscription_status',
            'subscription_ends_at',
            'is_trial_active',
            'is_subscription_valid',
            'has_access',
            'days_left_in_trial',
            'created_at',
        ]

    def get_is_trial_active(self, obj):
        return obj.is_trial_active()

    def get_is_subscription_valid(self, obj):
        return obj.is_subscription_valid()

    def get_has_access(self, obj):
        return obj.has_access()

    def get_days_left_in_trial(self, obj):
        return obj.days_left_in_trial()


class UserSerializer(serializers.ModelSerializer):
    tenant = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'is_staff',
            'tenant',
        ]

    def get_tenant(self, obj):
        profile = getattr(obj, 'profile', None)
        if profile is None or profile.tenant is None:
            return None
        tenant = profile.tenant
        tenant.sync_expiry_status()
        tenant.refresh_from_db()
        return TenantSubscriptionSerializer(tenant).data


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)
    store_name = serializers.CharField(max_length=200)

    # Allowed: letters, digits, and common special characters — no spaces or emojis.
    _ALLOWED_PASSWORD_RE = re.compile(r'^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{}|;:\'",.<>?/`~\\]+$')

    def validate_username(self, value):
        if ' ' in value:
            raise serializers.ValidationError('Username must not contain spaces.')
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_password(self, value):
        if ' ' in value:
            raise serializers.ValidationError('Password must not contain spaces.')
        if not self._ALLOWED_PASSWORD_RE.match(value):
            raise serializers.ValidationError(
                'Password may only contain letters, numbers, and special characters — no spaces or emojis.'
            )
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters.')
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError('Password must include at least one uppercase letter.')
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError('Password must include at least one lowercase letter.')
        if not re.search(r'\d', value):
            raise serializers.ValidationError('Password must include at least one number.')
        if not re.search(r'[^A-Za-z0-9]', value):
            raise serializers.ValidationError('Password must include at least one special character.')
        return value

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        username = attrs.get('username', '')
        password = attrs.get('password', '')
        if username and password and username.lower() in password.lower():
            raise serializers.ValidationError(
                {'password': 'Password must not contain your username.'}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        store_name = validated_data.pop('store_name')
        password = validated_data.pop('password')
        validated_data.pop('confirm_password', None)

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=password,
        )

        # post_save signal creates Tenant + UserProfile; update store name for trial tenant
        profile = UserProfile.objects.select_related('tenant').get(user=user)
        tenant = profile.tenant
        if tenant is None:
            tenant = Tenant.objects.create(name=store_name)
            profile.tenant = tenant
            profile.save(update_fields=['tenant'])
        else:
            tenant.name = store_name
            tenant.save(update_fields=['name'])

        return user
