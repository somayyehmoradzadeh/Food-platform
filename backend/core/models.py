from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models
from django.conf import settings
from django.contrib.gis.db import models


class User(AbstractUser):
    is_restaurant = models.BooleanField(default=False)
    phone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.username


class Restaurant(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='restaurants'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    address = models.CharField(max_length=500)
    location = models.PointField(geography=True)
    delivery_radius_m = models.IntegerField(default=5000)
    base_prep_time_min = models.PositiveIntegerField(default=20)
    is_open = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Category(models.Model):
    restaurant = models.ForeignKey(
        'Restaurant',
        on_delete=models.CASCADE,
        related_name='categories'
    )
    name = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.restaurant.name} - {self.name}"


class MenuItem(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='items'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_available = models.BooleanField(default=True)
    prep_time_min = models.PositiveIntegerField(default=15)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('delivering', 'Delivering'),
        ('completed', 'Completed'),
        ('canceled', 'Canceled'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='orders')
    delivery_address = models.CharField(max_length=500)
    delivery_location = models.PointField(geography=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    eta_min = models.PositiveIntegerField(default=30)
    eta = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id} - {self.user.username}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        # قیمت اتوماتیک از منو
        self.price = self.menu_item.price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.menu_item.name}"


class TableReservation(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='reservations')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reservations')
    date_time = models.DateTimeField()
    number_of_people = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('canceled', 'Canceled')
    ], default='pending')

    def __str__(self):
        return f"{self.user.username} - {self.restaurant.name} - {self.date_time}"


class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('online', 'Online'),
        ('cash', 'Cash on Delivery'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('canceled', 'Canceled'),
    ]

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name='payment'
    )

    method = models.CharField(
        max_length=10,
        choices=PAYMENT_METHOD_CHOICES
    )

    status = models.CharField(
        max_length=10,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending'
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    authority = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Gateway authority or token"
    )

    ref_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Payment reference ID from gateway"
    )

    paid_at = models.DateTimeField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    def __str__(self):
        return f"Payment #{self.id} - {self.order.id} - {self.status}"


