import logging
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import EmailMultiAlternatives
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import PasswordResetOTP
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
            otp_record = PasswordResetOTP.generate_otp_for_user(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password?email={user.email}&otp={otp_record.otp}"

            display_name = user.first_name or user.username
            subject = f"{otp_record.otp} is your SmartBill Nepal verification code"

            text_content = (
                f"Hello {display_name},\n\n"
                f"We received a request to reset your password for your SmartBill Nepal account ({user.username}).\n\n"
                f"Your 6-digit verification code is:\n\n"
                f"    {otp_record.otp}\n\n"
                f"This code will expire in 10 minutes.\n\n"
                f"Enter this code on the password reset page:\n"
                f"{settings.FRONTEND_URL}/reset-password?email={user.email}\n\n"
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
                  <div class="greeting">Hello {display_name},</div>
                  <div class="desc">
                    We received a request to reset the password for your account (<strong>{user.username}</strong>).
                    Use the 6-digit verification code below:
                  </div>
                  
                  <div class="otp-box">
                    <div class="otp-label">Verification Code</div>
                    <div class="otp-code">{otp_record.otp}</div>
                  </div>

                  <div class="desc" style="text-align: center; font-size: 13px; color: #64748b;">
                    This code is valid for <strong>10 minutes</strong>.
                  </div>

                  <div class="btn-wrapper">
                    <a href="{reset_url}" target="_blank" class="btn">Reset Password</a>
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
                msg = EmailMultiAlternatives(
                    subject=subject,
                    body=text_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[user.email],
                )
                msg.attach_alternative(html_content, "text/html")
                msg.send(fail_silently=False)
            except Exception as e:
                logger.error("Failed to send password reset OTP email to %s: %s", user.email, e)

        return Response({
            'message': 'If an account exists with this email, a 6-digit verification code has been sent.',
        })


class VerifyOTPAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        otp = request.data.get('otp', '').strip()

        if not email or not otp:
            return Response(
                {'valid': False, 'detail': 'Email and 6-digit code are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if not user:
            return Response(
                {'valid': False, 'detail': 'Invalid email address or code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp_record = (
            PasswordResetOTP.objects.filter(user=user, otp=otp, is_used=False)
            .order_by('-created_at')
            .first()
        )
        if not otp_record or not otp_record.is_valid():
            return Response(
                {'valid': False, 'detail': 'Invalid or expired 6-digit verification code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'valid': True,
            'message': 'Verification code is valid.',
            'username': user.username,
        })


class ResetPasswordAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        otp = request.data.get('otp', '').strip()
        new_password = request.data.get('new_password', '')

        if not email or not otp or not new_password:
            return Response(
                {'detail': 'Email, 6-digit OTP code, and new password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {'detail': 'New password must be at least 8 characters long.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if not user:
            return Response(
                {'detail': 'Invalid email address or code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp_record = (
            PasswordResetOTP.objects.filter(user=user, otp=otp, is_used=False)
            .order_by('-created_at')
            .first()
        )
        if not otp_record or not otp_record.is_valid():
            return Response(
                {'detail': 'Invalid or expired 6-digit verification code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        # Mark OTP as used
        otp_record.is_used = True
        otp_record.save(update_fields=['is_used'])

        return Response({
            'message': 'Password has been reset successfully. You can now log in with your new password.',
        })


