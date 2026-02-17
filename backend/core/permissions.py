from rest_framework.permissions import BasePermission


class IsRestaurantOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.restaurant.owner == request.user

class IsOrderOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

