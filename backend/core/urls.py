from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register('restaurants', RestaurantViewSet, basename='restaurants'),
router.register('categories', CategoryViewSet, basename='category'),
router.register('items', MenuItemViewSet, basename='menuitem'),
router.register('orders', OrderViewSet, basename='order'),
router.register('reservations', TableReservationViewSet, basename='reservation')

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('', include(router.urls)),
]
