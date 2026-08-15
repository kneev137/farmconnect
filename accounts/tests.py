from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import User, Consumer
from farmers.models import Farmer


class AccountsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('api_register')
        self.token_url = reverse('token_obtain_pair')
        self.me_url = reverse('api_me')
        self.change_password_url = reverse('api_change_password')

    def test_register_consumer(self):
        payload = {
            'username': 'john_consumer',
            'email': 'john@example.com',
            'password': 'SecurePassword123!',
            'phone_number': '1234567890',
            'role': 'consumer',
            'default_delivery_address': '123 Green St, Cityville'
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(username='john_consumer').count(), 1)
        user = User.objects.get(username='john_consumer')
        self.assertEqual(user.role, 'consumer')
        self.assertTrue(hasattr(user, 'consumer_profile'))
        self.assertEqual(user.consumer_profile.default_delivery_address, '123 Green St, Cityville')

    def test_register_farmer(self):
        payload = {
            'username': 'farmer_bob',
            'email': 'bob@farm.com',
            'password': 'FarmerPassword123!',
            'phone_number': '9876543210',
            'role': 'farmer',
            'farm_name': 'Sunny Acres Farm'
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='farmer_bob')
        self.assertEqual(user.role, 'farmer')
        self.assertTrue(hasattr(user, 'farmer_profile'))
        self.assertEqual(user.farmer_profile.farm_name, 'Sunny Acres Farm')

    def test_jwt_login_and_me_view(self):
        user = User.objects.create_user(
            username='alice_consumer',
            email='alice@example.com',
            password='TestPassword123!',
            role='consumer'
        )
        Consumer.objects.create(user=user, default_delivery_address='456 Orchard Way')

        # Obtain token
        login_res = self.client.post(self.token_url, {
            'username': 'alice_consumer',
            'password': 'TestPassword123!'
        })
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data['access']

        # Access /api/me/
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        me_res = self.client.get(self.me_url)
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data['username'], 'alice_consumer')
        self.assertEqual(me_res.data['default_delivery_address'], '456 Orchard Way')

        # Update profile
        update_res = self.client.patch(self.me_url, {
            'phone_number': '5551234567',
            'default_delivery_address': '789 New Oak Ln'
        })
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.phone_number, '5551234567')
        self.assertEqual(user.consumer_profile.default_delivery_address, '789 New Oak Ln')

    def test_change_password(self):
        user = User.objects.create_user(
            username='pwd_user',
            password='OldPassword123!',
            role='consumer'
        )
        self.client.force_authenticate(user=user)

        # Wrong old password
        res = self.client.post(self.change_password_url, {
            'old_password': 'WrongPassword123!',
            'new_password': 'BrandNewPassword123!'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Correct old password
        res2 = self.client.post(self.change_password_url, {
            'old_password': 'OldPassword123!',
            'new_password': 'BrandNewPassword123!'
        })
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password('BrandNewPassword123!'))
