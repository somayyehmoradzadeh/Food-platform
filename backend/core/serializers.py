from datetime import timezone

from rest_framework import serializers
from .models import *


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'is_restaurant']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_restaurant=validated_data.get('is_restaurant', False)
        )
        return user


class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = '__all__'


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = '__all__'

    def create(self, validated_data):
        items_data = validated_data.pop('items')

        # Order بساز
        order = Order.objects.create(**validated_data)

        # محاسبه total و ساخت OrderItem ها
        total = 0
        for item_data in items_data:
            menu_item = item_data['menu_item']
            quantity = item_data.get('quantity', 1)
            OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                quantity=quantity,
                price=menu_item.price * quantity
            )
            total += menu_item.price * quantity

        order.total_price = total
        # محاسبه ETA ساده
        eta = sum([item_data['menu_item'].prep_time_min * item_data.get('quantity', 1) for item_data in items_data]) + 10
        order.eta_min = eta
        order.save()

        # ایجاد Payment متصل به Order
        Payment.objects.create(
            order=order,
            amount=order.total_price,
            status='paid' if order.payment_method == 'cash' else 'pending',
            paid_at=timezone.now() if order.payment_method == 'cash' else None
        )

        return order

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = '__all__'


class TableReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableReservation
        fields = '__all__'

