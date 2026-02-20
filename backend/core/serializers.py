import math
from datetime import timedelta

from django.utils import timezone
from core.tasks import create_notification, print_order_receipt,auto_cancel_unpaid_order

from django.contrib.gis.geos import Point
from rest_framework import serializers
from .models import *



def haversine_km(lon1, lat1, lon2, lat2):
    R = 6371.0  # شعاع زمین
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    c = 2*math.asin(math.sqrt(a))
    return R * c

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
    menu_item = serializers.PrimaryKeyRelatedField(
        queryset=MenuItem.objects.all()
    )

    class Meta:
        model = OrderItem
        fields = ('menu_item', 'quantity')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    lat = serializers.FloatField(write_only=True)
    lng = serializers.FloatField(write_only=True)
    payment_method = serializers.ChoiceField(
        choices=[('cash', 'Cash'), ('online', 'Online')],
        write_only=True
    )
    class Meta:
        model = Order
        fields = '__all__'
        extra_kwargs = {
            'delivery_location': {'required': False},
            'delivery_address': {'required': False},

        }


    def create(self, validated_data):
        items_data = validated_data.pop('items')
        lat = validated_data.pop("lat")
        lng = validated_data.pop("lng")
        payment_method = validated_data.pop('payment_method', 'cash')
        validated_data["delivery_location"] = Point(lng, lat)

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
        # eta = sum([item_data['menu_item'].prep_time_min * item_data.get('quantity', 1) for item_data in items_data]) + 10
        # order.eta_min = eta
        restaurant = order.restaurant
        prep_minutes = restaurant.base_prep_time_min
        # جمع prep_time آیتم‌ها
        prep_minutes += sum([oi['menu_item'].prep_time_min * oi.get('quantity', 1) for oi in items_data])

        # محاسبه travel_minutes بر اساس فاصله
        travel_minutes = 15
        rest_point = restaurant.location
        user_point = order.delivery_location
        if rest_point and user_point:
            distance_km = haversine_km(rest_point.x, rest_point.y, user_point.x, user_point.y)
            travel_minutes = max(3, int(distance_km / 25 * 60))  # فرض سرعت متوسط 25 km/h

        total_minutes = prep_minutes + travel_minutes
        order.eta_min = total_minutes
        order.eta = timezone.now() + timedelta(minutes=total_minutes)
        order.save(update_fields=['total_price', 'eta_min', 'eta'])

        # ---------- ساخت Payment ----------
        Payment.objects.create(
            order=order,
            amount=total,
            status='paid' if payment_method == 'cash' else 'pending',
            method=payment_method,
            paid_at=timezone.now() if payment_method == 'cash' else None
        )

        # ---------- اجرای Celery فقط برای print_receipt ----------
        print_order_receipt.delay(order.id)
        create_notification.delay(
            order.restaurant.owner.id,
            f"New order #{order.id} has been placed."
        )
        if payment_method == "online":
            auto_cancel_unpaid_order.apply_async(
                (order.id,),
                countdown=600  # 10 minutes
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



class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ["user", "created_at"]
