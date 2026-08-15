from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, Consumer
from farmers.models import Farmer, Farm
from products.models import Product, Inventory
from orders.models import Order, OrderItem, Delivery
from reviews.models import Review


class ReviewsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Farmer & Farm & Product
        self.farmer_user = User.objects.create_user(username='farmer1', password='Password123!', role='farmer')
        self.farmer = Farmer.objects.create(user=self.farmer_user, farm_name='Green Acre Farms')
        self.farm = Farm.objects.create(farmer=self.farmer, name='Acre #1', location='North District')
        self.product = Product.objects.create(
            farm=self.farm, name='Organic Honey', category='other', price_per_unit=12.00, unit='jar'
        )
        self.inventory = Inventory.objects.create(product=self.product, quantity_available=50)

        # Consumer 1
        self.consumer1_user = User.objects.create_user(username='consumer1', password='Password123!', role='consumer')
        self.consumer1 = Consumer.objects.create(user=self.consumer1_user)

        # Consumer 2
        self.consumer2_user = User.objects.create_user(username='consumer2', password='Password123!', role='consumer')
        self.consumer2 = Consumer.objects.create(user=self.consumer2_user)

    def test_create_review(self):
        self.client.force_authenticate(user=self.consumer1_user)
        payload = {
            'product': self.product.id,
            'rating': 5,
            'comment': 'Delicious raw honey, fast delivery!'
        }
        res = self.client.post('/api/reviews/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Review.objects.filter(product=self.product).count(), 1)
        self.assertEqual(res.data['rating'], 5)
        self.assertEqual(res.data['consumer_username'], 'consumer1')

    def test_rating_boundary_validation(self):
        self.client.force_authenticate(user=self.consumer1_user)
        # Rating 6 should fail
        res = self.client.post('/api/reviews/', {'product': self.product.id, 'rating': 6, 'comment': 'Too high'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Rating 0 should fail
        res2 = self.client.post('/api/reviews/', {'product': self.product.id, 'rating': 0, 'comment': 'Too low'})
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_review_rejected(self):
        self.client.force_authenticate(user=self.consumer1_user)
        Review.objects.create(product=self.product, consumer=self.consumer1, rating=4, comment='First review')

        # Attempt second review on same product
        res = self.client.post('/api/reviews/', {'product': self.product.id, 'rating': 5, 'comment': 'Second review'})
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])

    def test_verified_purchase_flag_and_avg_rating_computation(self):
        # Create delivered order for consumer 1
        order = Order.objects.create(consumer=self.consumer1, total_amount=12.00, status='delivered')
        OrderItem.objects.create(order=order, product=self.product, quantity=1, price_at_purchase=12.00)
        Delivery.objects.create(order=order, address='123 Main St', status='delivered')

        # Consumer 1 posts 5-star review
        self.client.force_authenticate(user=self.consumer1_user)
        res1 = self.client.post('/api/reviews/', {'product': self.product.id, 'rating': 5, 'comment': 'Top notch'})
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res1.data['is_verified_purchase'])

        # Consumer 2 posts 3-star review (without purchase)
        self.client.force_authenticate(user=self.consumer2_user)
        res2 = self.client.post('/api/reviews/', {'product': self.product.id, 'rating': 3, 'comment': 'Decent'})
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertFalse(res2.data['is_verified_purchase'])

        # Check Product avg_rating: (5 + 3) / 2 = 4.0
        res_prod = self.client.get(f'/api/products/{self.product.id}/')
        self.assertEqual(res_prod.status_code, status.HTTP_200_OK)
        self.assertEqual(res_prod.data['avg_rating'], 4.0)
        self.assertEqual(res_prod.data['review_count'], 2)
