import re
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .api_views import _password_reset_key


@override_settings(
    CACHES={
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'password-reset-tests',
        }
    },
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
)
class PasswordResetFlowTests(TestCase):
    def setUp(self):
        cache.clear()
        mail.outbox = []
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='reset-user',
            email='reset@example.com',
            password='Old-pass123!',
        )

    def request_code(self, email='reset@example.com'):
        response = self.client.post(
            '/api/auth/forgot-password/',
            {'email': email},
            format='json',
        )
        return response

    def code_from_email(self):
        match = re.search(
            r'Your 6-digit verification code is:\s+(\d{6})',
            mail.outbox[0].body,
        )
        self.assertIsNotNone(match)
        return match.group(1)

    def verify_code(self, otp):
        return self.client.post(
            '/api/auth/verify-otp/',
            {'email': self.user.email, 'otp': otp},
            format='json',
        )

    def test_request_uses_generic_response_and_sends_a_code(self):
        response = self.request_code()

        self.assertEqual(response.status_code, 200)
        self.assertIn('If an account exists', response.data['message'])
        self.assertEqual(len(mail.outbox), 1)
        self.assertRegex(self.code_from_email(), r'^\d{6}$')

    def test_unknown_email_gets_same_success_response_without_mail(self):
        response = self.request_code('unknown@example.com')

        self.assertEqual(response.status_code, 200)
        self.assertIn('If an account exists', response.data['message'])
        self.assertEqual(len(mail.outbox), 0)

    @patch('accounts.api_views.EmailMultiAlternatives.send', side_effect=OSError('SMTP unavailable'))
    def test_failed_email_delivery_discards_otp_and_keeps_generic_response(self, _send):
        response = self.request_code()

        self.assertEqual(response.status_code, 200)
        self.assertIn('If an account exists', response.data['message'])
        self.assertIsNone(cache.get(_password_reset_key('otp', self.user.email)))

    @patch('accounts.api_views.EmailMultiAlternatives.send', return_value=0)
    def test_zero_sent_messages_discards_otp(self, _send):
        response = self.request_code()

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(cache.get(_password_reset_key('otp', self.user.email)))

    def test_otp_is_consumed_and_reset_token_cannot_be_replayed(self):
        self.assertEqual(self.request_code().status_code, 200)
        verification = self.verify_code(self.code_from_email())

        self.assertEqual(verification.status_code, 200)
        reset_token = verification.data['reset_token']
        self.assertEqual(len(reset_token), 43)
        self.assertEqual(self.verify_code(self.code_from_email()).status_code, 400)

        payload = {
            'email': self.user.email,
            'reset_token': reset_token,
            'new_password': 'New-pass123!',
            'new_password2': 'New-pass123!',
        }
        confirmation = self.client.post(
            '/api/auth/reset-password/',
            payload,
            format='json',
        )
        self.assertEqual(confirmation.status_code, 200)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('New-pass123!'))

        replay = self.client.post(
            '/api/auth/reset-password/',
            payload,
            format='json',
        )
        self.assertEqual(replay.status_code, 400)

    def test_password_mismatch_does_not_consume_reset_token(self):
        self.assertEqual(self.request_code().status_code, 200)
        verification = self.verify_code(self.code_from_email())
        reset_token = verification.data['reset_token']

        payload = {
            'email': self.user.email,
            'reset_token': reset_token,
            'new_password': 'New-pass123!',
            'new_password2': 'Different-pass123!',
        }
        mismatch = self.client.post(
            '/api/auth/reset-password/',
            payload,
            format='json',
        )
        self.assertEqual(mismatch.status_code, 400)

        payload['new_password2'] = payload['new_password']
        confirmation = self.client.post(
            '/api/auth/reset-password/',
            payload,
            format='json',
        )
        self.assertEqual(confirmation.status_code, 200)

    def test_five_wrong_attempts_invalidate_the_otp(self):
        self.assertEqual(self.request_code().status_code, 200)
        valid_otp = self.code_from_email()

        for attempt in range(5):
            response = self.verify_code('000000' if valid_otp != '000000' else '111111')
            self.assertEqual(response.status_code, 400)
            if attempt == 4:
                self.assertIn('Too many failed', response.data['detail'])

        expired = self.verify_code(valid_otp)
        self.assertEqual(expired.status_code, 400)

    def test_request_rate_limit_is_applied(self):
        for _ in range(3):
            self.assertEqual(
                self.request_code('not-registered@example.com').status_code,
                200,
            )

        limited = self.request_code('not-registered@example.com')
        self.assertEqual(limited.status_code, 429)

    def test_malformed_request_body_returns_bad_request(self):
        response = self.client.post(
            '/api/auth/forgot-password/',
            [],
            format='json',
        )
        self.assertEqual(response.status_code, 400)
