from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class AuthenticationTests(TestCase):
    """Test user registration, login, and JWT token workflow."""

    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/v1/auth/register/'
        self.login_url = '/api/v1/auth/login/'
        self.profile_url = '/api/v1/auth/profile/'
        self.user_data = {
            'username': 'researcher1',
            'email': 'researcher1@agyaanlab.ai',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'first_name': 'Alan',
            'last_name': 'Turing',
            'organization': 'AGYAAN LAB Institute',
            'role': 'researcher',
        }

    def test_user_registration(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
        self.assertEqual(response.data['user']['email'], 'researcher1@agyaanlab.ai')
        self.assertEqual(response.data['user']['full_name'], 'Alan Turing')

    def test_user_login(self):
        # First register
        self.client.post(self.register_url, self.user_data, format='json')

        # Now login
        login_data = {
            'email': 'researcher1@agyaanlab.ai',
            'password': 'SecurePassword123!',
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['role'], 'researcher')

    def test_authenticated_profile_access(self):
        reg_response = self.client.post(self.register_url, self.user_data, format='json')
        token = reg_response.data['tokens']['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        profile_response = self.client.get(self.profile_url)
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data['email'], 'researcher1@agyaanlab.ai')
