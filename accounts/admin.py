from django.contrib import admin
from .models import User, Consumer, Address, EmailOTP

admin.site.register(User)
admin.site.register(Consumer)
admin.site.register(Address)
admin.site.register(EmailOTP)