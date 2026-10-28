
from rest_framework import serializers
from .models import Product, WishlistItem


class ProductSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product
        fields = "__all__"


class WishlistItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(
        source="product",
        read_only=True,
    )

    class Meta:
        model = WishlistItem
        fields = [
            "id",
            "product",
            "product_details",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
