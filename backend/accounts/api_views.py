import hashlib
import hmac
import html
import logging
import re
import secrets
from urllib.parse import quote

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
import resend
from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserSerializer

logger = logging.getLogger(__name__)

PASSWORD_RESET_TTL = 600
PASSWORD_RESET_RATE_WINDOW = 3600
PASSWORD_RESET_EMAIL_LIMIT = 3
PASSWORD_RESET_IP_LIMIT = 10
PASSWORD_RESET_MAX_ATTEMPTS = 5


def _request_text(request, field, strip=True):
    data = request.data
    if not isinstance(data, dict):
        return ''
    value = data.get(field)
    if not isinstance(value, str):
        return ''
    return value.strip() if strip else value


def _password_reset_digest(value):
    return hmac.new(
        settings.SECRET_KEY.encode(),
        value.encode(),
        hashlib.sha256,
    ).hexdigest()


def _password_reset_key(kind, email):
    email_digest = hashlib.sha256(email.lower().encode()).hexdigest()
    return f'password-reset:{kind}:{email_digest}'


def _increment_rate_limit(key):
    if cache.add(key, 1, timeout=PASSWORD_RESET_RATE_WINDOW):
        return 1
    try:
        return cache.incr(key)
    except ValueError:
        if cache.add(key, 1, timeout=PASSWORD_RESET_RATE_WINDOW):
            return 1
        return cache.incr(key)


def _rate_limit_exceeded(request, email):
    email_count = _increment_rate_limit(
        _password_reset_key('request-email-rate', email)
    )
    ip_address = request.META.get('REMOTE_ADDR') or 'unknown'
    ip_digest = hashlib.sha256(ip_address.encode()).hexdigest()
    ip_count = _increment_rate_limit(
        f'password-reset:request-ip-rate:{ip_digest}'
    )
    return (
        email_count > PASSWORD_RESET_EMAIL_LIMIT
        or ip_count > PASSWORD_RESET_IP_LIMIT
    )


def _password_reset_error(message, response_status=status.HTTP_400_BAD_REQUEST):
    return Response({'detail': message}, status=response_status)


def tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                'user': UserSerializer(user).data,
                'tokens': tokens_for_user(user),
                'message': 'Registration successful. Your 3-day free trial has started.',
            },
            status=status.HTTP_201_CREATED,
        )


class LoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username or not password:
            return Response(
                {'detail': 'Username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {'detail': 'Invalid username or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            {
                'user': UserSerializer(user).data,
                'tokens': tokens_for_user(user),
            }
        )


class MeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ProfileUpdateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        user = request.user
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.email = request.data.get('email', user.email)
        user.save(update_fields=['first_name', 'last_name', 'email'])
        return Response(UserSerializer(user).data)


class ChangePasswordAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password', '')
        new_password = request.data.get('new_password', '')

        if not old_password or not new_password:
            return Response(
                {'detail': 'Both old and new passwords are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(old_password):
            return Response(
                {'detail': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {'detail': 'New password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password changed successfully.'})


class DeleteAccountAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    CONFIRM_PHRASE = 'delete-my-account'

    def delete(self, request):
        user = request.user
        password = request.data.get('password', '')
        confirmation = request.data.get('confirmation', '')

        if not password:
            return Response(
                {'detail': 'Password is required to delete your account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(password):
            return Response(
                {'detail': 'Incorrect password.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if confirmation != self.CONFIRM_PHRASE:
            return Response(
                {
                    'detail': f'Type "{self.CONFIRM_PHRASE}" to confirm account deletion.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.delete()
        return Response({'message': 'Account deleted successfully.'})


class ForgotPasswordAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = _request_text(request, 'email').lower()
        if not email:
            return Response(
                {'detail': 'Email address is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if _rate_limit_exceeded(request, email):
            response = _password_reset_error(
                'Too many requests. Please try again later.',
                status.HTTP_429_TOO_MANY_REQUESTS,
            )
            response['Retry-After'] = str(PASSWORD_RESET_RATE_WINDOW)
            return response

        otp_key = _password_reset_key('otp', email)
        verified_key = _password_reset_key('verified', email)
        cache.delete(otp_key)
        cache.delete(verified_key)
        user = User.objects.filter(email__iexact=email, is_active=True).first()

        if user:
            otp_code = f'{secrets.randbelow(900000) + 100000}'
            nonce = secrets.token_urlsafe(16)
            cache.set(
                otp_key,
                {
                    'user_id': user.pk,
                    'otp_digest': _password_reset_digest(f'{email}:{otp_code}'),
                    'nonce': nonce,
                },
                timeout=PASSWORD_RESET_TTL,
            )
            reset_url = (
                f'{settings.FRONTEND_URL}/reset-password'
                f'?email={quote(user.email, safe="")}'
            )
            display_name = user.first_name or user.username
            display_name_html = html.escape(display_name)
            username_html = html.escape(user.username)
            reset_url_html = html.escape(reset_url, quote=True)
            subject = f'{otp_code} is your SmartBill Nepal verification code'

            text_content = (
                f"Hello {display_name},\n\n"
                f"We received a request to reset your password for your SmartBill Nepal account ({user.username}).\n\n"
                f"Your 6-digit verification code is:\n\n"
                f"    {otp_code}\n\n"
                f"This code will expire in 10 minutes.\n\n"
                f"Enter this code on the password reset page:\n"
                f"{reset_url}\n\n"
                f"If you did not request a password reset, you can safely ignore this email.\n\n"
                f"— The SmartBill Nepal Team"
            )

            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
                .container {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
                .header {{ background: #0f172a; padding: 28px 24px; text-align: center; }}
                .logo-circle {{ width: 44px; height: 44px; background: linear-gradient(135deg, #4f46e5, #0ea5e9); border-radius: 12px; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 20px; font-weight: bold; line-height: 44px; }}
                .header h1 {{ color: #ffffff; margin: 0; font-size: 19px; font-weight: 700; letter-spacing: -0.5px; }}
                .content {{ padding: 32px 24px; }}
                .greeting {{ font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }}
                .desc {{ font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }}
                .otp-box {{ background: #f8fafc; border: 2px dashed #4f46e5; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }}
                .otp-label {{ font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; margin-bottom: 6px; }}
                .otp-code {{ font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; font-family: 'Courier New', monospace; }}
                .btn-wrapper {{ text-align: center; margin: 24px 0 16px; }}
                .btn {{ background-color: #4f46e5; color: #ffffff !important; padding: 12px 26px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block; }}
                .notice {{ font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
                .footer {{ border-top: 1px solid #e2e8f0; padding: 16px 24px; background: #f8fafc; font-size: 12px; color: #94a3b8; text-align: center; }}
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo-circle">S</div>
                  <h1>SmartBill Nepal</h1>
                </div>
                <div class="content">
                  <div class="greeting">Hello {display_name_html},</div>
                  <div class="desc">
                    We received a request to reset the password for your account (<strong>{username_html}</strong>).
                    Use the 6-digit verification code below:
                  </div>
                  
                  <div class="otp-box">
                    <div class="otp-label">Verification Code</div>
                    <div class="otp-code">{otp_code}</div>
                  </div>

                  <div class="desc" style="text-align: center; font-size: 13px; color: #64748b;">
                    This code is valid for <strong>10 minutes</strong>.
                  </div>

                  <div class="btn-wrapper">
                    <a href="{reset_url_html}" target="_blank" class="btn">Reset Password</a>
                  </div>

                  <div class="notice">
                    If you did not request this code, you can safely ignore this email. No changes will be made to your account.
                  </div>
                </div>
                <div class="footer">
                  © SmartBill Nepal · Modern Billing & Inventory Platform
                </div>
              </div>
            </body>
            </html>
            """

            try:
                resend.api_key = settings.RESEND_API_KEY
                params: resend.Emails.SendParams = {
                    "from": settings.DEFAULT_FROM_EMAIL,
                    "to": [user.email],
                    "subject": subject,
                    "html": html_content,
                    "text": text_content,
                }
                resend.Emails.send(params)
            except Exception as e:
                cache.delete(otp_key)
                logger.exception(
                    "Password reset OTP email delivery failed: %s", e
                )
                return Response(
                    {
                        'detail': (
                            f'Failed to send email ({type(e).__name__}). '
                            'Check RESEND_API_KEY and domain verification on resend.com.'
                        ),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        else:
            logger.warning(
                "Password reset requested for email '%s', but no active user was found in the database.",
                email,
            )

        return Response({
            'message': 'If an account exists with this email, a 6-digit verification code has been sent.',
        })


class VerifyOTPAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = _request_text(request, 'email').lower()
        otp = _request_text(request, 'otp')

        if not email or not otp:
            return Response(
                {'valid': False, 'detail': 'Email and 6-digit code are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not re.fullmatch(r'\d{6}', otp):
            return Response(
                {'valid': False, 'detail': 'Invalid email address or code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp_key = _password_reset_key('otp', email)
        attempts_key = _password_reset_key('attempts', email)
        otp_data = cache.get(otp_key)
        if not otp_data:
            return Response(
                {'valid': False, 'detail': 'Invalid or expired 6-digit verification code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if cache.get(attempts_key, 0) >= PASSWORD_RESET_MAX_ATTEMPTS:
            cache.delete(otp_key)
            cache.delete(attempts_key)
            return _password_reset_error(
                'Too many failed verification attempts. Please request a new code.'
            )

        submitted_digest = _password_reset_digest(f'{email}:{otp}')
        if not hmac.compare_digest(otp_data['otp_digest'], submitted_digest):
            if not cache.add(attempts_key, 0, timeout=PASSWORD_RESET_TTL):
                try:
                    attempts = cache.incr(attempts_key)
                except ValueError:
                    cache.add(attempts_key, 0, timeout=PASSWORD_RESET_TTL)
                    attempts = cache.incr(attempts_key)
            else:
                attempts = cache.incr(attempts_key)

            if attempts >= PASSWORD_RESET_MAX_ATTEMPTS:
                cache.delete(otp_key)
                cache.delete(attempts_key)
                message = (
                    'Too many failed verification attempts. Please request a new code.'
                )
            else:
                message = 'Invalid or expired 6-digit verification code.'
            return _password_reset_error(message)

        consumed_key = _password_reset_key(
            f'consumed-otp:{otp_data["nonce"]}',
            email,
        )
        if not cache.add(consumed_key, True, timeout=PASSWORD_RESET_TTL):
            return _password_reset_error(
                'Invalid or expired 6-digit verification code.'
            )

        cache.delete(otp_key)
        cache.delete(attempts_key)
        reset_token = secrets.token_urlsafe(32)
        cache.set(
            _password_reset_key('verified', email),
            {
                'user_id': otp_data['user_id'],
                'token_digest': _password_reset_digest(
                    f'{email}:{reset_token}'
                ),
            },
            timeout=PASSWORD_RESET_TTL,
        )
        return Response({'reset_token': reset_token})


class ResetPasswordAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = _request_text(request, 'email').lower()
        reset_token = _request_text(request, 'reset_token')
        new_password = _request_text(request, 'new_password', strip=False)
        new_password2 = _request_text(request, 'new_password2', strip=False)

        if not email or not reset_token or not new_password or not new_password2:
            return Response(
                {'detail': 'Email, reset token, and both password fields are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password != new_password2:
            return Response(
                {'detail': 'Passwords do not match.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            len(new_password) < 8
            or not re.search(r'[a-z]', new_password)
            or not re.search(r'[A-Z]', new_password)
            or not re.search(r'\d', new_password)
            or not re.search(r'[^A-Za-z0-9]', new_password)
        ):
            return Response(
                {
                    'detail': (
                        'Password must be at least 8 characters and include '
                        'uppercase and lowercase letters, a number, and a special character.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        verified_key = _password_reset_key('verified', email)
        verified_data = cache.get(verified_key)
        submitted_digest = _password_reset_digest(f'{email}:{reset_token}')
        if (
            not verified_data
            or not hmac.compare_digest(
                verified_data['token_digest'],
                submitted_digest,
            )
        ):
            return Response(
                {'detail': 'Invalid or expired reset token. Please verify your code again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(
            pk=verified_data['user_id'],
            email__iexact=email,
            is_active=True,
        ).first()
        if not user:
            return _password_reset_error(
                'Invalid email address or reset token.'
            )

        try:
            validate_password(new_password, user=user)
        except ValidationError as error:
            return _password_reset_error(' '.join(error.messages))

        consumed_key = _password_reset_key(
            f'consumed-token:{_password_reset_digest(reset_token)}',
            email,
        )
        if not cache.add(consumed_key, True, timeout=PASSWORD_RESET_TTL):
            return _password_reset_error(
                'Invalid or expired reset token. Please verify your code again.'
            )

        cache.delete(verified_key)
        with transaction.atomic():
            user.set_password(new_password)
            user.save(update_fields=['password'])

        return Response({
            'message': 'Password has been reset successfully. You can now log in with your new password.',
        })
