from decimal import Decimal
from django.test import TestCase
from django.db import connection, IntegrityError
from django.utils import timezone
from accounts.models import User, Consumer
from farmers.models import Farmer, Farm, City
from products.models import Product, Inventory, HarvestRecord, Category
from orders.models import Cart, CartItem, Order, OrderItem, Payment, Delivery, OrderStatusHistory
from reviews.models import Review


class DatabaseOptimizationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        # 1. Apply SQL triggers, functions, views
        with connection.cursor() as cursor:
            for sql_file in ['database/sql/01_triggers.sql', 'database/sql/02_stored_procedures.sql']:
                with open(sql_file, 'r', encoding='utf-8') as f:
                    cursor.execute(f.read())
            # Execute view definition
            with open('database/sql/03_views_and_indexes.sql', 'r', encoding='utf-8') as f:
                content = f.read()
                # Split indexes out or execute view
                view_sql = content.split('-- STRATEGIC B-TREE INDEXES')[0]
                cursor.execute(view_sql)

        # 2. User & Consumer
        cls.consumer_user = User.objects.create_user(
            username='db_test_consumer', email='consumer@test.com', password='password123', role='consumer'
        )
        cls.consumer = Consumer.objects.create(user=cls.consumer_user, default_delivery_address='42 Orchard Road')

        # 3. Farmer & Farm
        cls.farmer_user = User.objects.create_user(
            username='db_test_farmer', email='farmer@test.com', password='password123', role='farmer'
        )
        cls.farmer = Farmer.objects.create(user=cls.farmer_user, farm_name='Green Fields', verified=True)
        cls.city = City.objects.create(name='Pune', state='Maharashtra')
        cls.farm = Farm.objects.create(farmer=cls.farmer, name='Hilltop Organic', city=cls.city, location='Hilltop, Pune')

        # 4. Category & Product
        cls.category = Category.objects.create(slug='test-veg', name='Test Vegetables')
        cls.product = Product.objects.create(
            farm=cls.farm,
            name='Organic Tomatoes',
            category_rel=cls.category,
            category='test-veg',
            price_per_unit=Decimal('50.00'),
            unit='kg'
        )
        cls.inventory = Inventory.objects.create(product=cls.product, quantity_available=Decimal('100.00'))


    def test_trigger_harvest_stock_sync(self):
        """Verify trg_harvest_stock_sync automatically increments inventory on HarvestRecord insertion."""
        initial_stock = self.inventory.quantity_available
        HarvestRecord.objects.create(
            product=self.product,
            harvest_date=timezone.now().date(),
            quantity_harvested=Decimal('25.50')
        )
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.quantity_available, initial_stock + Decimal('25.50'))

    def test_trigger_order_total_recalculation(self):
        """Verify trg_calculate_order_total recalculates order.total_amount automatically on items change."""
        order = Order.objects.create(consumer=self.consumer, total_amount=Decimal('0.00'), status='pending')
        self.assertEqual(order.total_amount, Decimal('0.00'))

        # Add item
        OrderItem.objects.create(order=order, product=self.product, quantity=Decimal('3.00'), price_at_purchase=Decimal('50.00'))
        order.refresh_from_db()
        self.assertEqual(order.total_amount, Decimal('150.00'))

        # Add second item
        OrderItem.objects.create(order=order, product=self.product, quantity=Decimal('2.00'), price_at_purchase=Decimal('50.00'))
        order.refresh_from_db()
        self.assertEqual(order.total_amount, Decimal('250.00'))

    def test_trigger_delivery_cascade_to_order(self):
        """Verify trg_delivery_status_cascade marks order delivered when delivery is completed."""
        order = Order.objects.create(consumer=self.consumer, total_amount=Decimal('100.00'), status='pending')
        delivery = Delivery.objects.create(order=order, address='42 Orchard Road', status='preparing')

        delivery.status = 'delivered'
        delivery.save()

        order.refresh_from_db()
        delivery.refresh_from_db()
        self.assertEqual(order.status, 'delivered')
        self.assertIsNotNone(delivery.delivered_at)

    def test_trigger_order_status_audit_trail(self):
        """Verify trg_order_audit_trail logs every status change in orders_orderstatushistory."""
        order = Order.objects.create(consumer=self.consumer, total_amount=Decimal('100.00'), status='pending')
        order.status = 'confirmed'
        order.save()
        order.status = 'delivered'
        order.save()

        history = OrderStatusHistory.objects.filter(order=order).order_by('changed_at')
        self.assertEqual(history.count(), 2)
        self.assertEqual(history[0].old_status, 'pending')
        self.assertEqual(history[0].new_status, 'confirmed')
        self.assertEqual(history[1].old_status, 'confirmed')
        self.assertEqual(history[1].new_status, 'delivered')

    def test_stored_function_place_order(self):
        """Verify fn_place_order executes atomic checkout directly in PostgreSQL."""
        cart = Cart.objects.create(consumer=self.consumer)
        CartItem.objects.create(cart=cart, product=self.product, quantity=Decimal('4.00'))

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT fn_place_order(%s, %s, %s);",
                [self.consumer.id, '42 Orchard Road, Pune', 'card']
            )
            result = cursor.fetchone()[0]

        self.assertTrue(result['success'])
        order_id = result['order_id']

        # Verify DB state
        order = Order.objects.get(id=order_id)
        self.assertEqual(order.total_amount, Decimal('200.00'))
        self.assertEqual(order.items.count(), 1)
        self.assertEqual(CartItem.objects.filter(cart=cart).count(), 0)

        # Verify inventory was decremented
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.quantity_available, Decimal('96.00'))

    def test_check_constraints_prevent_invalid_data(self):
        """Verify CHECK constraints at the database level reject invalid inputs."""
        from django.db import transaction

        # 1. Negative product price
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Product.objects.create(
                    farm=self.farm, name='Invalid', price_per_unit=Decimal('-10.00'), unit='kg'
                )

        # 2. Review rating > 5
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Review.objects.create(
                    product=self.product, consumer=self.consumer, rating=6, comment='Too good'
                )


    def test_product_catalog_view(self):
        """Verify vw_product_catalog view yields precomputed aggregates correctly."""
        with connection.cursor() as cursor:
            cursor.execute("SELECT product_name, quantity_available FROM vw_product_catalog WHERE product_id = %s;", [self.product.id])
            row = cursor.fetchone()
            self.assertEqual(row[0], 'Organic Tomatoes')
            self.assertEqual(row[1], self.inventory.quantity_available)
