import logging
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserSerializer

logger = logging.getLogger(__name__)


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
        email = request.data.get('email', '').strip()
        if not email:
            return Response(
                {'detail': 'Email address is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        users = list(User.objects.filter(email__iexact=email, is_active=True))

        for user in users:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

            display_name = user.first_name or user.username
            subject = "Reset your SmartBill Nepal password"

            text_content = (
                f"Hello {display_name},\n\n"
                f"We received a request to reset your password for your SmartBill Nepal account ({user.username}).\n\n"
                f"Click the link below to set a new password:\n"
                f"{reset_url}\n\n"
                f"This password reset link will expire in 24 hours.\n\n"
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
                .container {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
                .header {{ background: #0f172a; padding: 32px 24px; text-align: center; }}
                .logo-circle {{ width: 48px; height: 48px; background: linear-gradient(135deg, #4f46e5, #0ea5e9); border-radius: 12px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 22px; font-weight: bold; line-height: 48px; }}
                .header h1 {{ color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }}
                .content {{ padding: 32px 24px; }}
                .greeting {{ font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }}
                .desc {{ font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }}
                .btn-wrapper {{ text-align: center; margin: 32px 0; }}
                .btn {{ background-color: #4f46e5; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block; box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3); }}
                .alt-link {{ font-size: 12px; line-height: 1.5; color: #64748b; word-break: break-all; margin-top: 24px; padding: 12px; background: #f1f5f9; border-radius: 8px; }}
                .footer {{ border-top: 1px solid #e2e8f0; padding: 20px 24px; background: #f8fafc; font-size: 12px; color: #94a3b8; text-align: center; }}
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo-circle">S</div>
                  <h1>SmartBill Nepal</h1>
                </div>
                <div class="content">
                  <div class="greeting">Hello {display_name},</div>
                  <div class="desc">
                    We received a request to reset the password for your account associated with <strong>{user.username}</strong>.
                    Click the button below to set a new password:
                  </div>
                  <div class="btn-wrapper">
                    <a href="{reset_url}" target="_blank" class="btn">Reset Password</a>
                  </div>
                  <div class="desc">
                    This link will expire in <strong>24 hours</strong>. If you did not make this request, you can safely ignore this email and your password will remain unchanged.
                  </div>
                  <div class="alt-link">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="{reset_url}" style="color: #4f46e5;">{reset_url}</a>
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
                msg = EmailMultiAlternatives(
                    subject=subject,
                    body=text_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[user.email],
                )
                msg.attach_alternative(html_content, "text/html")
                msg.send(fail_silently=False)
            except Exception as e:
                logger.error("Failed to send password reset email to %s: %s", user.email, e)

        return Response({
            'message': 'If an account exists with this email, a password reset link has been sent.',
        })


class ResetPasswordAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Verify if reset token is valid before showing reset form."""
        uid_b64 = request.query_params.get('uid', '').strip()
        token = request.query_params.get('token', '').strip()

        if not uid_b64 or not token:
            return Response(
                {'valid': False, 'detail': 'Missing reset parameters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            uid = force_str(urlsafe_base64_decode(uid_b64))
            user = User.objects.get(pk=uid, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'valid': False, 'detail': 'Invalid password reset link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {'valid': False, 'detail': 'This reset link has expired or has already been used.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'valid': True,
            'username': user.username,
        })

    def post(self, request):
        """Set new password using reset token."""
        uid_b64 = request.data.get('uid', '').strip()
        token = request.data.get('token', '').strip()
        new_password = request.data.get('new_password', '')

        if not uid_b64 or not token or not new_password:
            return Response(
                {'detail': 'UID, token, and new password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {'detail': 'New password must be at least 8 characters long.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            uid = force_str(urlsafe_base64_decode(uid_b64))
            user = User.objects.get(pk=uid, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'detail': 'Invalid or expired password reset link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {'detail': 'Invalid or expired password reset link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        return Response({
            'message': 'Password has been reset successfully. You can now log in with your new password.',
        })

