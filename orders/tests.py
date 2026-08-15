from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, Consumer
from farmers.models import Farmer, Farm
from products.models import Product, Inventory
from orders.models import Cart, CartItem, Order, OrderItem, Payment, Delivery


class OrdersAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Farmer
        self.farmer_user = User.objects.create_user(username='farmer1', password='Password123!', role='farmer')
        self.farmer = Farmer.objects.create(user=self.farmer_user, farm_name='Green Acre Farms')
        self.farm = Farm.objects.create(farmer=self.farmer, name='Acre #1', location='North District')

        # Products
        self.product = Product.objects.create(
            farm=self.farm, name='Fresh Milk', category='dairy', price_per_unit=3.00, unit='litre'
        )
        self.inventory = Inventory.objects.create(product=self.product, quantity_available=20.00)

        # Consumer
        self.consumer_user = User.objects.create_user(username='consumer1', password='Password123!', role='consumer')
        self.consumer = Consumer.objects.create(user=self.consumer_user, default_delivery_address='55 Pine St')

    def test_cart_operations(self):
        self.client.force_authenticate(user=self.consumer_user)

        # Add item to cart
        res = self.client.post('/api/cart-items/', {'product': self.product.id, 'quantity': 5})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # Add more of the same item -> should merge
        res2 = self.client.post('/api/cart-items/', {'product': self.product.id, 'quantity': 3})
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)

        # View Cart
        res_cart = self.client.get('/api/cart/')
        self.assertEqual(res_cart.status_code, status.HTTP_200_OK)
        self.assertEqual(res_cart.data['total_items'], 8.0)
        self.assertEqual(float(res_cart.data['grand_total']), 24.00)

        # Attempt to add more than available stock -> 400
        res_overflow = self.client.post('/api/cart-items/', {'product': self.product.id, 'quantity': 50})
        self.assertEqual(res_overflow.status_code, status.HTTP_400_BAD_REQUEST)

    def test_atomic_checkout_and_inventory_decrement(self):
        self.client.force_authenticate(user=self.consumer_user)
        # Add 6 litres of milk
        self.client.post('/api/cart-items/', {'product': self.product.id, 'quantity': 6})

        # Checkout
        checkout_payload = {
            'address': '55 Pine St, Apt 4B',
            'payment_method': 'card'
        }
        res = self.client.post('/api/checkout/', checkout_payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        order_id = res.data['id']

        # Verify stock decremented: 20 - 6 = 14
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.quantity_available, 14.00)

        # Verify Order, Payment, Delivery created
        order = Order.objects.get(id=order_id)
        self.assertEqual(float(order.total_amount), 18.00)
        self.assertEqual(order.items.count(), 1)
        self.assertTrue(hasattr(order, 'payment'))
        self.assertEqual(order.payment.method, 'card')
        self.assertTrue(hasattr(order, 'delivery'))
        self.assertEqual(order.delivery.status, 'preparing')

        # Cart should now be empty
        cart = Cart.objects.get(consumer=self.consumer)
        self.assertEqual(cart.items.count(), 0)

    def test_order_cancellation_restores_inventory(self):
        self.client.force_authenticate(user=self.consumer_user)
        self.client.post('/api/cart-items/', {'product': self.product.id, 'quantity': 4})
        checkout_res = self.client.post('/api/checkout/', {'address': '55 Pine St', 'payment_method': 'upi'})
        order_id = checkout_res.data['id']

        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.quantity_available, 16.00)

        # Cancel order
        cancel_res = self.client.post(f'/api/orders/{order_id}/cancel/')
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)

        # Verify inventory restored: 16 + 4 = 20
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.quantity_available, 20.00)

        order = Order.objects.get(id=order_id)
        self.assertEqual(order.status, 'cancelled')

    def test_farmer_orders_view_and_delivery_status_update(self):
        # Create order
        self.client.force_authenticate(user=self.consumer_user)
        self.client.post('/api/cart-items/', {'product': self.product.id, 'quantity': 2})
        checkout_res = self.client.post('/api/checkout/', {'address': '55 Pine St', 'payment_method': 'cod'})
        order_id = checkout_res.data['id']

        # Farmer views incoming orders
        self.client.force_authenticate(user=self.farmer_user)
        res_farmer_orders = self.client.get('/api/farmer-orders/')
        self.assertEqual(res_farmer_orders.status_code, status.HTTP_200_OK)
        self.assertEqual(res_farmer_orders.data['count'], 1)
        self.assertEqual(res_farmer_orders.data['results'][0]['id'], order_id)

        # Farmer updates delivery status to out_for_delivery
        delivery_id = res_farmer_orders.data['results'][0]['delivery']['id']
        res_update = self.client.patch(f'/api/deliveries/{delivery_id}/status/', {
            'status': 'out_for_delivery'
        })
        self.assertEqual(res_update.status_code, status.HTTP_200_OK)

        order = Order.objects.get(id=order_id)
        self.assertEqual(order.status, 'shipped')

        # Farmer updates delivery status to delivered
        res_deliver = self.client.patch(f'/api/deliveries/{delivery_id}/status/', {
            'status': 'delivered'
        })
        self.assertEqual(res_deliver.status_code, status.HTTP_200_OK)

        order.refresh_from_db()
        self.assertEqual(order.status, 'delivered')
        self.assertIsNotNone(order.delivery.delivered_at)

    def test_simulate_payment(self):
        self.client.force_authenticate(user=self.consumer_user)
        self.client.post('/api/cart-items/', {'product': self.product.id, 'quantity': 1})
        checkout_res = self.client.post('/api/checkout/', {'address': '55 Pine St', 'payment_method': 'card'})
        payment_id = checkout_res.data['payment']['id']
        order_id = checkout_res.data['id']

        # Simulate pay
        pay_res = self.client.post(f'/api/payments/{payment_id}/pay/')
        self.assertEqual(pay_res.status_code, status.HTTP_200_OK)
        self.assertEqual(pay_res.data['status'], 'completed')

        order = Order.objects.get(id=order_id)
        self.assertEqual(order.status, 'confirmed')
