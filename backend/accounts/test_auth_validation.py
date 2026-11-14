from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from accounts.serializers import RegisterSerializer


class RegistrationValidationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_valid_registration(self):
        data = {
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'StrongP@ssw0rd!',
            'confirm_password': 'StrongP@ssw0rd!',
            'store_name': 'John Store',
        }
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertEqual(user.username, 'john_doe')

    def test_password_mismatch(self):
        data = {
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'StrongP@ssw0rd!',
            'confirm_password': 'DifferentP@ssw0rd!',
            'store_name': 'John Store',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('confirm_password', serializer.errors)

    def test_password_too_short(self):
        data = {
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'P@1s',
            'confirm_password': 'P@1s',
            'store_name': 'John Store',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_password_missing_uppercase(self):
        data = {
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'strongp@ssw0rd!',
            'confirm_password': 'strongp@ssw0rd!',
            'store_name': 'John Store',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_password_missing_lowercase(self):
        data = {
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'STRONGP@SSW0RD!',
            'confirm_password': 'STRONGP@SSW0RD!',
            'store_name': 'John Store',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_password_missing_number(self):
        data = {
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'StrongP@ssword!',
            'confirm_password': 'StrongP@ssword!',
            'store_name': 'John Store',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_password_missing_special(self):
        data = {
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'StrongPassword1',
            'confirm_password': 'StrongPassword1',
            'store_name': 'John Store',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_password_with_space(self):
        data = {
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'Strong P@ss1',
            'confirm_password': 'Strong P@ss1',
            'store_name': 'John Store',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_password_with_emoji(self):
        data = {
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'StrongP@ss1😊',
            'confirm_password': 'StrongP@ss1😊',
            'store_name': 'John Store',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_password_containing_username(self):
        data = {
            'username': 'JohnDoe',
            'email': 'john@example.com',
            'password': '123johndoe!@#A',
            'confirm_password': '123johndoe!@#A',
            'store_name': 'John Store',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_username_with_space(self):
        data = {
            'username': 'john doe',
            'email': 'john@example.com',
            'password': 'StrongP@ssw0rd!',
            'confirm_password': 'StrongP@ssw0rd!',
            'store_name': 'John Store',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    def test_login_blocks_space_in_credentials(self):
        resp = self.client.post(
            '/api/auth/login/',
            {'username': 'john doe', 'password': 'password'},
            format='json',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('must not contain spaces', resp.data['detail'])


class ChangePasswordValidationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='janedoe',
            email='jane@example.com',
            password='OldPassword123!',
        )
        self.client.force_authenticate(user=self.user)

    def test_valid_change_password(self):
        resp = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'OldPassword123!',
                'new_password': 'NewStrongP@ss1!',
                'confirm_password': 'NewStrongP@ss1!',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewStrongP@ss1!'))

    def test_change_password_mismatch(self):
        resp = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'OldPassword123!',
                'new_password': 'NewStrongP@ss1!',
                'confirm_password': 'DifferentP@ss1!',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('Passwords do not match', resp.data['detail'])

    def test_change_password_with_space(self):
        resp = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'OldPassword123!',
                'new_password': 'New Strong1!',
                'confirm_password': 'New Strong1!',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('must not contain spaces', resp.data['detail'])

    def test_change_password_with_emoji(self):
        resp = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'OldPassword123!',
                'new_password': 'NewStrong1!😊',
                'confirm_password': 'NewStrong1!😊',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('no spaces or emojis', resp.data['detail'])

    def test_change_password_containing_username(self):
        resp = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'OldPassword123!',
                'new_password': 'JaneDoe!12345',
                'confirm_password': 'JaneDoe!12345',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('must not contain your username', resp.data['detail'])

    def test_change_password_missing_uppercase(self):
        resp = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'OldPassword123!',
                'new_password': 'lowercase123!',
                'confirm_password': 'lowercase123!',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('uppercase', resp.data['detail'])

    def test_change_password_missing_lowercase(self):
        resp = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'OldPassword123!',
                'new_password': 'UPPERCASE123!',
                'confirm_password': 'UPPERCASE123!',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('lowercase', resp.data['detail'])

    def test_change_password_missing_number(self):
        resp = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'OldPassword123!',
                'new_password': 'NoNumberHere!',
                'confirm_password': 'NoNumberHere!',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('number', resp.data['detail'])

    def test_change_password_missing_special(self):
        resp = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'OldPassword123!',
                'new_password': 'NoSpecialChar1',
                'confirm_password': 'NoSpecialChar1',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('special character', resp.data['detail'])

    def test_change_password_too_short(self):
        resp = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'OldPassword123!',
                'new_password': 'Sh1!',
                'confirm_password': 'Sh1!',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('at least 8 characters', resp.data['detail'])

    def test_change_password_incorrect_old_password(self):
        resp = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'WrongPassword123!',
                'new_password': 'NewValidPass1!',
                'confirm_password': 'NewValidPass1!',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('Current password is incorrect', resp.data['detail'])

