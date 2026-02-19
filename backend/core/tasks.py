from celery import shared_task
from datetime import timedelta
from django.utils import timezone
from .models import Order
import math

def haversine_km(lon1, lat1, lon2, lat2):
    R = 6371.0
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    c = 2*math.asin(math.sqrt(a))
    return R*c

@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=5, retry_kwargs={'max_retries':3})
def calculate_order_eta(self, order_id):
    order = Order.objects.select_related('restaurant').prefetch_related('items__menu_item').get(id=order_id)

    prep_minutes = sum([oi.menu_item.prep_time_min * (oi.quantity or 1) for oi in order.items.all()])

    travel_minutes = 15
    if order.restaurant.location and order.delivery_location:
        distance_km = haversine_km(
            order.restaurant.location.x, order.restaurant.location.y,
            order.delivery_location.x, order.delivery_location.y
        )
        travel_minutes = max(3, int(distance_km / 25 * 60))  # سرعت متوسط 25 km/h

    total_minutes = prep_minutes + travel_minutes

    order.eta_min = total_minutes
    order.eta = timezone.now() + timedelta(minutes=total_minutes)
    order.save(update_fields=['eta_min','eta'])

    return {'eta_min': total_minutes, 'eta': order.eta.isoformat()}

@shared_task
def print_order_receipt(order_id):
    order = Order.objects.get(id=order_id)
    print(f"Printing receipt for Order #{order.id}")
