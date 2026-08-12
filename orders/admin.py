from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Cart, CartItem, Order, OrderItem, Payment, Delivery

admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Payment)
admin.site.register(Delivery)