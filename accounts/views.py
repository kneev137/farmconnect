# Create your views here.
from django.shortcuts import render, redirect
from django.contrib.auth import login
from .forms import SignUpForm
from .models import Consumer
from farmers.models import Farmer


def register(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            if user.role == 'consumer':
                Consumer.objects.create(user=user)
            elif user.role == 'farmer':
                Farmer.objects.create(user=user, farm_name=f"{user.username}'s Farm")
            login(request, user)
            return redirect('home')
    else:
        form = SignUpForm()
    return render(request, 'accounts/register.html', {'form': form})