from django.shortcuts import render

# Create your views here.
from django.shortcuts import render
from .models import Product


def product_list(request):
    products = Product.objects.filter(is_active=True).select_related('farm', 'farm__farmer')
    return render(request, 'products/product_list.html', {'products': products})