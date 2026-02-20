from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register('restaurants', RestaurantViewSet, basename='restaurants'),
router.register('categories', CategoryViewSet, basename='category'),
router.register('items', MenuItemViewSet, basename='menuitem'),
router.register('orders', OrderViewSet, basename='order'),
router.register(r'restaurant/orders', RestaurantOrderViewSet, basename='restaurant-orders')
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register('reservations', TableReservationViewSet, basename='reservation')

urlpatterns = [
    path('register/', RegisterView.as_view()),
    # Payment
    path('verify-payment/', VerifyPaymentAPIView.as_view(), name='verify-payment'),
    path('dashboard/', DashboardAPIView.as_view(), name='dashboard'),
    # Update order status (restaurant)
    path('update-order-status/', UpdateOrderStatusAPIView.as_view(), name='update-order-status'),
    path('', include(router.urls)),

]
