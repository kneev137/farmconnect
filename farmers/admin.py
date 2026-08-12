from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Farmer, Farm

admin.site.register(Farmer)
admin.site.register(Farm)