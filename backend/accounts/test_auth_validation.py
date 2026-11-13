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

