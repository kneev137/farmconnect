from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, Consumer
from farmers.models import Farmer, Farm
from products.models import Product, Inventory
from orders.models import Order, OrderItem, Payment, Delivery


class FarmersAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Farmer 1
        self.farmer_user = User.objects.create_user(username='farmer1', password='Password123!', role='farmer')
        self.farmer = Farmer.objects.create(user=self.farmer_user, farm_name='Green Valley')

        # Farm
        self.farm = Farm.objects.create(farmer=self.farmer, name='Valley North', location='Hills County', size_acres=25.5)

        # Consumer
        self.consumer_user = User.objects.create_user(username='consumer1', password='Password123!', role='consumer')
        self.consumer = Consumer.objects.create(user=self.consumer_user, default_delivery_address='10 Market St')

    def test_create_farm_as_farmer(self):
        self.client.force_authenticate(user=self.farmer_user)
        payload = {
            'name': 'Valley South Orchard',
            'location': 'Southern Plains',
            'size_acres': 15.0,
            'description': 'Organic fruit orchard'
        }
        res = self.client.post('/api/farms/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Farm.objects.filter(name='Valley South Orchard').count(), 1)
        created = Farm.objects.get(name='Valley South Orchard')
        self.assertEqual(created.farmer, self.farmer)

    def test_consumer_cannot_create_farm(self):
        self.client.force_authenticate(user=self.consumer_user)
        payload = {'name': 'Fake Farm', 'location': 'Nowhere'}
        res = self.client.post('/api/farms/', payload)
        # Consumer should get 403 or error
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST])

    def test_farmer_metrics_view(self):
        self.client.force_authenticate(user=self.farmer_user)

        # Create product & inventory
        product = Product.objects.create(
            farm=self.farm,
            name='Organic Tomatoes',
            category='vegetable',
            price_per_unit=4.50,
            unit='kg'
        )
        Inventory.objects.create(product=product, quantity_available=3)  # low stock <= 5

        # Create Order with OrderItem
        order = Order.objects.create(consumer=self.consumer, total_amount=13.50, status='confirmed')
        OrderItem.objects.create(order=order, product=product, quantity=3, price_at_purchase=4.50)
        Payment.objects.create(order=order, method='card', amount=13.50, status='completed')
        Delivery.objects.create(order=order, address='10 Market St', status='preparing')

        res = self.client.get('/api/farmer/metrics/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(float(res.data['total_revenue']), 13.50)
        self.assertEqual(res.data['total_orders'], 1)
        self.assertEqual(res.data['active_orders'], 1)
        self.assertEqual(res.data['total_products'], 1)
        self.assertEqual(res.data['low_stock_products'], 1)
