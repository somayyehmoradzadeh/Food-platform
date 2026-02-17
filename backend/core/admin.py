from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import *
from django.contrib.gis.admin import GISModelAdmin


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ('username', 'email', 'is_staff', 'is_restaurant', 'is_active')
    list_filter = ('is_staff', 'is_restaurant', 'is_active')
    search_fields = ('username', 'email', 'phone')
    ordering = ('username',)
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password', 'phone')}),
        ('Permissions', {'fields': ('is_staff', 'is_restaurant', 'is_active', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'is_staff', 'is_restaurant', 'is_active')}
         ),
    )



@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'restaurant', 'order')
    list_filter = ('restaurant',)
    search_fields = ('name',)


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'is_available')
    list_filter = ('category', 'is_available')
    search_fields = ('name',)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'restaurant', 'status', 'total_price', 'eta_min', 'created_at')
    list_filter = ('status', 'restaurant')
    search_fields = ('user__username', 'restaurant__name')
    inlines = [OrderItemInline]
    ordering = ('-created_at',)


@admin.register(TableReservation)
class TableReservationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'restaurant', 'date_time', 'number_of_people', 'status', 'created_at')
    list_filter = ('restaurant', 'status')
    search_fields = ('user__username', 'restaurant__name')
    ordering = ('-date_time',)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'method', 'status', 'amount', 'paid_at', 'created_at')
    list_filter = ('method', 'status')
    search_fields = ('order__id', 'authority', 'ref_id')
    ordering = ('-created_at',)



@admin.register(Restaurant)
class RestaurantAdmin(GISModelAdmin):
    list_display = ('name', 'owner', 'is_open', 'delivery_radius_m')
    search_fields = ('name', 'owner__username', 'address')
    list_filter = ('is_open',)
    map_width = 800
    map_height = 500
    default_lon = 51.3890
    default_lat = 35.6892
    default_zoom = 12

