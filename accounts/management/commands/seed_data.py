from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from accounts.models import User, Consumer
from farmers.models import Farmer, Farm
from products.models import Product, Inventory, HarvestRecord
from reviews.models import Review
from orders.models import Order, OrderItem, Payment, Delivery, Cart, CartItem


class Command(BaseCommand):
    help = 'Cleans up test accounts and seeds 20+ realistic farm products across verified farmers.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("Cleaning up old test users and farms..."))

        # 1. Delete old dummy test accounts
        dummy_usernames = ['user1', 'user2', 'user3', 'user4', 'testconsumer', 'testconsumer2', 'testfarmer1']
        User.objects.filter(username__in=dummy_usernames).delete()

        # Delete any orphaned products or farms named 'Test Farm' or 'Sivan'
        Farm.objects.filter(name__in=['Test Farm', 'Sivan']).delete()
        Product.objects.filter(name__in=['tomato', 'Carrots']).delete()

        self.stdout.write(self.style.NOTICE("Seeding 6 verified farmers and 20+ farm-fresh products..."))

        # 2. Seed Realistic Consumers
        consumers_data = [
            ('priya_sharma', 'priya@example.com', 'Priya Sharma', '9845012345', '14 Indiranagar 100ft Rd, Bengaluru'),
            ('arjun_mehta', 'arjun@example.com', 'Arjun Mehta', '9820011223', 'Flat 402, Sea Breeze Apts, Bandra West, Mumbai'),
            ('deepa_nair', 'deepa@example.com', 'Deepa Nair', '9447098765', '22 Anna Nagar East, Chennai'),
            ('vikram_singh', 'vikram@example.com', 'Vikram Singh', '9811022334', '88 Vasant Vihar, New Delhi'),
            ('rohit_verma', 'rohit@example.com', 'Rohit Verma', '9890033445', '12 Koregaon Park, Pune'),
        ]
        created_consumers = []
        for username, email, _, phone, address in consumers_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'role': 'consumer',
                    'phone_number': phone,
                }
            )
            if created:
                user.set_password('testpass123')
                user.save()
            consumer, _ = Consumer.objects.get_or_create(
                user=user,
                defaults={'default_delivery_address': address}
            )
            created_consumers.append(consumer)

        # 3. 6 Verified Farmers & 21 Products
        farmers_data = [
            {
                'username': 'ramesh_patel',
                'email': 'ramesh@sahyadrifarms.in',
                'phone': '9822019876',
                'farm_name': 'Sahyadri Organic Orchard',
                'bio': '3rd generation organic fruit grower nestled in the Sahyadri foothills. We practice zero-chemical natural farming with Jeevamrutha soil enrichment and drip irrigation.',
                'verified': True,
                'farms': [
                    {
                        'name': 'Sahyadri Valley East',
                        'location': 'Nashik, Maharashtra',
                        'size_acres': Decimal('32.5'),
                        'description': 'Sun-drenched hillside orchard cultivating export-grade Alphonso mangoes, pomegranates, and sweet seedless grapes.',
                    }
                ],
                'products': [
                    {
                        'name': 'Sindhu Ripe Mangoes',
                        'category': 'fruit',
                        'description': 'Naturally tree-ripened, intensely sweet organic mangoes with zero carbide ripening.',
                        'price_per_unit': Decimal('180.00'),
                        'unit': 'kg',
                        'stock': Decimal('45.0'),
                        'days_ago': 0,
                        'notes': 'Handpicked this morning at sunrise',
                    },
                    {
                        'name': 'Bhagwa Ruby Pomegranates',
                        'category': 'fruit',
                        'description': 'Deep red, antioxidant-rich organic pomegranates bursting with sweet juice.',
                        'price_per_unit': Decimal('140.00'),
                        'unit': 'kg',
                        'stock': Decimal('60.0'),
                        'days_ago': 1,
                        'notes': 'Sorted for grade-A size and sugar content',
                    },
                    {
                        'name': 'Sweet Seedless Green Grapes',
                        'category': 'fruit',
                        'description': 'Crisp, naturally sweet Thomson seedless grapes cultivated without chemical berry enlargers.',
                        'price_per_unit': Decimal('95.00'),
                        'unit': 'kg',
                        'stock': Decimal('55.0'),
                        'days_ago': 1,
                        'notes': 'Carefully bunched in ventilated organic crates',
                    },
                    {
                        'name': 'Farm Fresh Nashik Red Onions',
                        'category': 'vegetable',
                        'description': 'Pungent, high-solids red onions cured under sun-shades for exceptional shelf life and aroma.',
                        'price_per_unit': Decimal('32.00'),
                        'unit': 'kg',
                        'stock': Decimal('150.0'),
                        'days_ago': 2,
                        'notes': 'Naturally sun-cured with intact dry outer skins',
                    },
                ]
            },
            {
                'username': 'ananya_sen',
                'email': 'ananya@nilgirinaturals.in',
                'phone': '9443217890',
                'farm_name': 'Nilgiri Mist Valley Farm',
                'bio': 'Pioneering high-altitude regenerative horticulture. We cultivate crisp alpine vegetables in pure mountain soil watered by natural springs.',
                'verified': True,
                'farms': [
                    {
                        'name': 'Highland Mist Estate',
                        'location': 'Ooty, Tamil Nadu',
                        'size_acres': Decimal('18.0'),
                        'description': 'Terraced farm at 2,200m altitude benefitting from cool mountain weather for ultra-crisp root crops and strawberries.',
                    }
                ],
                'products': [
                    {
                        'name': 'Mountain Sweet Carrots',
                        'category': 'vegetable',
                        'description': 'Crunchy, naturally sweet baby carrots freshly pulled from volcanic mountain soil.',
                        'price_per_unit': Decimal('45.00'),
                        'unit': 'kg',
                        'stock': Decimal('85.0'),
                        'days_ago': 0,
                        'notes': 'Washed in pure spring water right after harvest',
                    },
                    {
                        'name': 'Tuscan Leafy Kale & Spinach',
                        'category': 'vegetable',
                        'description': 'Tender, nutrient-dense dark leafy greens harvested fresh with the morning dew.',
                        'price_per_unit': Decimal('50.00'),
                        'unit': 'bunch',
                        'stock': Decimal('30.0'),
                        'days_ago': 0,
                        'notes': 'Zero chemical spray, companion planted with marigolds',
                    },
                    {
                        'name': 'Highland Alpine Strawberries',
                        'category': 'fruit',
                        'description': 'Fragrant, naturally sweet alpine strawberries grown under shade netting.',
                        'price_per_unit': Decimal('160.00'),
                        'unit': 'box',
                        'stock': Decimal('25.0'),
                        'days_ago': 1,
                        'notes': 'Delicate harvest, packed in eco-friendly vented punnets',
                    },
                    {
                        'name': 'Crisp Mountain Broccoli',
                        'category': 'vegetable',
                        'description': 'Tight, deep green broccoli florets grown in cool high-altitude mountain air.',
                        'price_per_unit': Decimal('70.00'),
                        'unit': 'kg',
                        'stock': Decimal('40.0'),
                        'days_ago': 0,
                        'notes': 'Harvested before morning heat to retain maximum crispness',
                    },
                ]
            },
            {
                'username': 'harpreet_singh',
                'email': 'harpreet@punjabheritage.in',
                'phone': '9814012345',
                'farm_name': 'Punjab Heritage Grains',
                'bio': 'Preserving indigenous heirloom grains and traditional stone-milling traditions without synthetic pesticides or hybrid GMO seeds.',
                'verified': True,
                'farms': [
                    {
                        'name': 'Sutlej River Plains',
                        'location': 'Ludhiana, Punjab',
                        'size_acres': Decimal('45.0'),
                        'description': 'Fertile alluvial soil plains dedicated to traditional Sharbati wheat, basmati, and cold-pressed mustard.',
                    }
                ],
                'products': [
                    {
                        'name': 'Sharbati Heirloom Whole Wheat',
                        'category': 'grain',
                        'description': 'Golden, high-protein native Sharbati wheat grains, stone-milled or whole for soft aromatic rotis.',
                        'price_per_unit': Decimal('65.00'),
                        'unit': 'kg',
                        'stock': Decimal('120.0'),
                        'days_ago': 3,
                        'notes': 'Sun-dried and stored with neem leaves for natural pest resistance',
                    },
                    {
                        'name': 'Aged Royal Basmati Rice',
                        'category': 'grain',
                        'description': 'Extra-long grain aromatic Basmati naturally aged for 2 years for fluffy non-sticky cooking.',
                        'price_per_unit': Decimal('130.00'),
                        'unit': 'kg',
                        'stock': Decimal('90.0'),
                        'days_ago': 4,
                        'notes': 'Traditional water-saving direct seeding method',
                    },
                    {
                        'name': 'Cold-Pressed Wood-Ghani Mustard Oil',
                        'category': 'other',
                        'description': 'Pure pungent virgin mustard oil cold-pressed in traditional wooden Kolhu Ghani below 40 degrees C.',
                        'price_per_unit': Decimal('220.00'),
                        'unit': 'litre',
                        'stock': Decimal('45.0'),
                        'days_ago': 2,
                        'notes': 'Single cold press extraction with zero chemical solvents',
                    },
                ]
            },
            {
                'username': 'kavitha_murugan',
                'email': 'kavitha@cauverypastures.in',
                'phone': '9842099887',
                'farm_name': 'Cauvery Dairy & Apiary Pastures',
                'bio': 'Holistic free-range farm raising indigenous Gir and Kangayam cows with love, alongside wild forest bee apiaries for raw unfiltered honey.',
                'verified': True,
                'farms': [
                    {
                        'name': 'Cauvery Riverbank Pastures',
                        'location': 'Tiruchirappalli, Tamil Nadu',
                        'size_acres': Decimal('22.0'),
                        'description': 'Green riverside pastures where native cattle graze on natural clover and herbal grasses.',
                    }
                ],
                'products': [
                    {
                        'name': 'A2 Pure Desi Cow Fresh Milk',
                        'category': 'dairy',
                        'description': 'Farm-fresh raw whole milk from grass-fed indigenous Gir cows, delivered cold in glass bottles.',
                        'price_per_unit': Decimal('75.00'),
                        'unit': 'litre',
                        'stock': Decimal('40.0'),
                        'days_ago': 0,
                        'notes': 'Morning milking at 5:00 AM, unpasteurized and whole',
                    },
                    {
                        'name': 'Bilona Churned Cultured Ghee',
                        'category': 'dairy',
                        'description': 'Traditional Vedic Bilona method ghee made from curd cultured whole milk, slow cooked on woodfire.',
                        'price_per_unit': Decimal('680.00'),
                        'unit': 'jar',
                        'stock': Decimal('18.0'),
                        'days_ago': 2,
                        'notes': 'Rich golden aroma with medicinal granulated texture',
                    },
                    {
                        'name': 'Fresh Artisanal Malai Paneer',
                        'category': 'dairy',
                        'description': 'Melt-in-mouth cottage cheese crafted daily using fresh whole milk and natural lemon curdling.',
                        'price_per_unit': Decimal('120.00'),
                        'unit': 'box',
                        'stock': Decimal('22.0'),
                        'days_ago': 0,
                        'notes': 'Prepared fresh this morning, zero preservatives',
                    },
                    {
                        'name': 'Raw Wild Forest Honey',
                        'category': 'other',
                        'description': '100% pure raw unheated honey harvested from multi-floral forest apiaries along the Western Ghats.',
                        'price_per_unit': Decimal('320.00'),
                        'unit': 'jar',
                        'stock': Decimal('35.0'),
                        'days_ago': 2,
                        'notes': 'Unfiltered, rich in natural pollen and bee propolis',
                    },
                ]
            },
            {
                'username': 'suresh_reddy',
                'email': 'suresh@deccangroves.in',
                'phone': '9848011223',
                'farm_name': 'Deccan Organic Grove & Pulses',
                'bio': 'Dryland organic farming specialist cultivating drought-hardy heirloom pulses, heirloom tomatoes, and crisp bell peppers using solar-powered micro-irrigation.',
                'verified': True,
                'farms': [
                    {
                        'name': 'Deccan Sun Orchard',
                        'location': 'Mahabubnagar, Telangana',
                        'size_acres': Decimal('28.0'),
                        'description': 'Red loamy soil plateau farm producing organic heirloom pulses and vine-ripened nightshade crops.',
                    }
                ],
                'products': [
                    {
                        'name': 'Organic Vine Ripe Tomatoes',
                        'category': 'vegetable',
                        'description': 'Juicy, naturally sweet heirloom country tomatoes picked ripe straight from the vine.',
                        'price_per_unit': Decimal('35.00'),
                        'unit': 'kg',
                        'stock': Decimal('95.0'),
                        'days_ago': 0,
                        'notes': 'Picked vine-red for rich lycopene and real tomato aroma',
                    },
                    {
                        'name': 'Crisp Tri-Color Bell Peppers',
                        'category': 'vegetable',
                        'description': 'Thick-walled crunchy capsicums grown in naturally ventilated polyhouses.',
                        'price_per_unit': Decimal('85.00'),
                        'unit': 'kg',
                        'stock': Decimal('35.0'),
                        'days_ago': 1,
                        'notes': 'Hand selected for vibrant color and crisp texture',
                    },
                    {
                        'name': 'Unpolished Organic Toor Dal',
                        'category': 'grain',
                        'description': 'Farm-grown split pigeon peas unpolished with oil or water for authentic taste and maximum protein.',
                        'price_per_unit': Decimal('165.00'),
                        'unit': 'kg',
                        'stock': Decimal('80.0'),
                        'days_ago': 3,
                        'notes': 'Stone split, retains natural fiber and nutrients',
                    },
                ]
            },
            {
                'username': 'gurpreet_sandhu',
                'email': 'gurpreet@himorchards.in',
                'phone': '9816099881',
                'farm_name': 'Himalayan Ridge Orchards',
                'bio': 'High-altitude organic apple and walnut orchard situated at 7,500ft in Kotgarh. Snow-fed irrigation and sub-zero winter chilling yield unmatched flavor.',
                'verified': True,
                'farms': [
                    {
                        'name': 'Kotgarh Snow Valley',
                        'location': 'Shimla, Himachal Pradesh',
                        'size_acres': Decimal('20.0'),
                        'description': 'Steep mountain orchard surrounded by deodar forests, producing premium Himalayan apples and wild walnuts.',
                    }
                ],
                'products': [
                    {
                        'name': 'Royal Delicious Himalayan Apples',
                        'category': 'fruit',
                        'description': 'Crunchy, sweet mountain apples with deep red hue and honey aroma grown in glacier runoff.',
                        'price_per_unit': Decimal('190.00'),
                        'unit': 'kg',
                        'stock': Decimal('70.0'),
                        'days_ago': 1,
                        'notes': 'Tree-ripened, hand-wrapped in recycled fruit socks',
                    },
                    {
                        'name': 'Wild Mountain Shelled Walnuts',
                        'category': 'other',
                        'description': 'Organically harvested wild walnuts with light golden kernels and high omega-3 oil content.',
                        'price_per_unit': Decimal('480.00'),
                        'unit': 'box',
                        'stock': Decimal('28.0'),
                        'days_ago': 5,
                        'notes': 'Naturally sun-cured on pine needle mats',
                    },
                    {
                        'name': 'Organic Dried Kashmiri Saffron',
                        'category': 'other',
                        'description': 'Grade A1 pure red stigmas hand-harvested from purple Crocus sativus flowers in high valley soils.',
                        'price_per_unit': Decimal('350.00'),
                        'unit': 'gram',
                        'stock': Decimal('15.0'),
                        'days_ago': 4,
                        'notes': 'Laboratory tested for high Crocin coloring strength',
                    },
                ]
            },
        ]

        sample_reviews = [
            ("Unbelievable freshness! You can smell the soil on the produce, and it cooks in half the time.", 5),
            ("Tastes just like the produce we used to get from village markets. 100% genuine quality.", 5),
            ("Clean packaging, prompt delivery, and knowing 90% goes straight to the farmer feels amazing.", 5),
            ("Crisp and juicy. Far superior to supermarket cold-storage items.", 5),
            ("Great quality and wonderful aroma. Definitely ordering every week.", 4),
        ]

        today = timezone.now().date()
        total_products_count = 0

        for f_data in farmers_data:
            user, created = User.objects.get_or_create(
                username=f_data['username'],
                defaults={
                    'email': f_data['email'],
                    'role': 'farmer',
                    'phone_number': f_data['phone'],
                }
            )
            if created:
                user.set_password('testpass123')
                user.save()

            farmer, _ = Farmer.objects.get_or_create(
                user=user,
                defaults={
                    'farm_name': f_data['farm_name'],
                    'bio': f_data['bio'],
                    'verified': f_data['verified'],
                }
            )
            farmer.farm_name = f_data['farm_name']
            farmer.bio = f_data['bio']
            farmer.verified = f_data['verified']
            farmer.save()

            for farm_data in f_data['farms']:
                farm, _ = Farm.objects.get_or_create(
                    farmer=farmer,
                    name=farm_data['name'],
                    defaults={
                        'location': farm_data['location'],
                        'size_acres': farm_data['size_acres'],
                        'description': farm_data['description'],
                    }
                )
                farm.location = farm_data['location']
                farm.size_acres = farm_data['size_acres']
                farm.description = farm_data['description']
                farm.save()

                for p_data in f_data['products']:
                    product, _ = Product.objects.get_or_create(
                        farm=farm,
                        name=p_data['name'],
                        defaults={
                            'category': p_data['category'],
                            'description': p_data['description'],
                            'price_per_unit': p_data['price_per_unit'],
                            'unit': p_data['unit'],
                            'is_active': True,
                        }
                    )
                    product.description = p_data['description']
                    product.price_per_unit = p_data['price_per_unit']
                    product.unit = p_data['unit']
                    product.category = p_data['category']
                    product.is_active = True
                    product.save()
                    total_products_count += 1

                    # Inventory
                    inv, _ = Inventory.objects.get_or_create(
                        product=product,
                        defaults={'quantity_available': p_data['stock']}
                    )
                    inv.quantity_available = p_data['stock']
                    inv.save()

                    # Harvest Record
                    harvest_date = today - timedelta(days=p_data['days_ago'])
                    HarvestRecord.objects.get_or_create(
                        product=product,
                        harvest_date=harvest_date,
                        defaults={
                            'quantity_harvested': p_data['stock'] + Decimal('25.0'),
                            'notes': p_data['notes'],
                        }
                    )

                    # Add authentic sample reviews from verified consumers
                    if created_consumers:
                        for idx, consumer in enumerate(created_consumers[:3]):
                            review_comment, review_rating = sample_reviews[(product.id + idx) % len(sample_reviews)]
                            Review.objects.get_or_create(
                                product=product,
                                consumer=consumer,
                                defaults={
                                    'rating': review_rating,
                                    'comment': review_comment,
                                }
                            )

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {len(farmers_data)} verified farmers and {total_products_count} realistic products!"))
