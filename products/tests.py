from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, Consumer
from farmers.models import Farmer, Farm
from products.models import Product, Inventory, HarvestRecord


class ProductsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Farmer 1
        self.farmer_user = User.objects.create_user(username='farmer1', password='Password123!', role='farmer')
        self.farmer = Farmer.objects.create(user=self.farmer_user, farm_name='Green Acre Farms')
        self.farm = Farm.objects.create(farmer=self.farmer, name='Acre #1', location='North District')

        # Farmer 2
        self.farmer2_user = User.objects.create_user(username='farmer2', password='Password123!', role='farmer')
        self.farmer2 = Farmer.objects.create(user=self.farmer2_user, farm_name='Blue Ridge Farms')
        self.farm2 = Farm.objects.create(farmer=self.farmer2, name='Ridge #2', location='South District')

        # Consumer
        self.consumer_user = User.objects.create_user(username='consumer1', password='Password123!', role='consumer')
        self.consumer = Consumer.objects.create(user=self.consumer_user)

    def test_create_product_with_initial_stock(self):
        self.client.force_authenticate(user=self.farmer_user)
        payload = {
            'farm': self.farm.id,
            'name': 'Fresh Apples',
            'category': 'fruit',
            'description': 'Crisp organic apples',
            'price_per_unit': '3.20',
            'unit': 'kg',
            'initial_stock': '50.00'
        }
        res = self.client.post('/api/products/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.filter(name='Fresh Apples').count(), 1)
        product = Product.objects.get(name='Fresh Apples')
        self.assertTrue(hasattr(product, 'inventory'))
        self.assertEqual(product.inventory.quantity_available, 50.00)

    def test_farmer_cannot_create_product_on_other_farm(self):
        self.client.force_authenticate(user=self.farmer_user)
        payload = {
            'farm': self.farm2.id,  # belongs to farmer2
            'name': 'Stolen Fruit',
            'category': 'fruit',
            'price_per_unit': '2.00',
            'unit': 'kg'
        }
        res = self.client.post('/api/products/', payload)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_consumer_cannot_create_product(self):
        self.client.force_authenticate(user=self.consumer_user)
        payload = {
            'farm': self.farm.id,
            'name': 'Unauthorized',
            'category': 'fruit',
            'price_per_unit': '1.00',
            'unit': 'kg'
        }
        res = self.client.post('/api/products/', payload)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_product_search_and_filters(self):
        p1 = Product.objects.create(farm=self.farm, name='Carrot Organic', category='vegetable', price_per_unit=2.50, unit='kg')
        Inventory.objects.create(product=p1, quantity_available=20)

        p2 = Product.objects.create(farm=self.farm, name='Sweet Strawberries', category='fruit', price_per_unit=6.00, unit='box')
        Inventory.objects.create(product=p2, quantity_available=0)  # out of stock

        # Search by term 'Carrot'
        res = self.client.get('/api/products/?search=Carrot')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['name'], 'Carrot Organic')

        # Filter by in_stock=true
        res_stock = self.client.get('/api/products/?in_stock=true')
        self.assertEqual(res_stock.status_code, status.HTTP_200_OK)
        self.assertEqual(res_stock.data['count'], 1)
        self.assertEqual(res_stock.data['results'][0]['id'], p1.id)

        # Filter by category
        res_cat = self.client.get('/api/products/?category=fruit')
        self.assertEqual(res_cat.status_code, status.HTTP_200_OK)
        self.assertEqual(res_cat.data['count'], 1)
        self.assertEqual(res_cat.data['results'][0]['id'], p2.id)

    def test_my_products_view(self):
        p1 = Product.objects.create(farm=self.farm, name='Farmer1 Produce', category='vegetable', price_per_unit=2.00, unit='kg')
        Inventory.objects.create(product=p1, quantity_available=10)
        p2 = Product.objects.create(farm=self.farm2, name='Farmer2 Produce', category='fruit', price_per_unit=4.00, unit='kg')
        Inventory.objects.create(product=p2, quantity_available=10)

        self.client.force_authenticate(user=self.farmer_user)
        res = self.client.get('/api/my-products/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['name'], 'Farmer1 Produce')

    def test_harvest_record_increments_inventory(self):
        self.client.force_authenticate(user=self.farmer_user)
        product = Product.objects.create(farm=self.farm, name='Potatoes', category='vegetable', price_per_unit=1.50, unit='kg')
        inventory = Inventory.objects.create(product=product, quantity_available=10.00)

        payload = {
            'product': product.id,
            'harvest_date': '2026-08-14',
            'quantity_harvested': '25.50',
            'notes': 'Morning harvest, grade A'
        }
        res = self.client.post('/api/harvest-records/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        inventory.refresh_from_db()
        self.assertEqual(inventory.quantity_available, 35.50)
