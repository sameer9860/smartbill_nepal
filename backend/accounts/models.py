import random
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


def default_otp_expiry():
    return timezone.now() + timedelta(minutes=10)


class PasswordResetOTP(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_reset_otps',
    )
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_otp_expiry)
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Password Reset OTP'
        verbose_name_plural = 'Password Reset OTPs'

    def __str__(self):
        return f"OTP for {self.user.username} ({self.otp}) - Used: {self.is_used}"

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at

    @classmethod
    def generate_otp_for_user(cls, user):
        # Invalidate existing unused OTPs
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        # 6-digit numeric code
        code = f"{random.randint(100000, 999999)}"
        return cls.objects.create(user=user, otp=code)

