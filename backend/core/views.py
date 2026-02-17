from rest_framework import generics, viewsets, permissions
from .serializers import *
from .models import Category, MenuItem
from .permissions import IsRestaurantOwner, IsOrderOwner


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer


class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantOwner]

    def get_queryset(self):
        # فقط دسته‌های رستوران‌هایی که کاربر صاحبش هست رو نشون بده
        return Category.objects.filter(restaurant__owner=self.request.user)


class MenuItemViewSet(viewsets.ModelViewSet):
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantOwner]

    def get_queryset(self):
        return MenuItem.objects.filter(
            category__restaurant__owner=self.request.user
        )

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrderOwner]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)



class TableReservationViewSet(viewsets.ModelViewSet):
    serializer_class = TableReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # مشتری فقط رزرو خودش رو می‌بینه
        if not user.is_restaurant:
            return TableReservation.objects.filter(user=user)
        # رستوران، همه رزروها رو می‌بینه
        return TableReservation.objects.filter(restaurant__owner=user)