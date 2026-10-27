
from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from products.models import Product
from .models import Order, OrderItem


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)
    delivery_address = serializers.CharField()
    items = OrderItemInputSerializer(many=True, allow_empty=False)

    def validate_items(self, items):
        product_ids = [item["product_id"] for item in items]

        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError(
                "Each product should appear only once. Update its quantity instead."
            )

        products = Product.objects.in_bulk(product_ids)

        for item in items:
            product = products.get(item["product_id"])

            if product is None:
                raise serializers.ValidationError(
                    f"Product {item['product_id']} does not exist."
                )

            if not product.is_available or product.stock_quantity < item["quantity"]:
                raise serializers.ValidationError(
                    f"{product.name} is unavailable or has insufficient stock."
                )

        return items

    @transaction.atomic
    def create(self, validated_data):
        items = validated_data.pop("items")
        product_ids = [item["product_id"] for item in items]

        # Lock product rows where the database supports row-level locking.
        products = {
            product.id: product
            for product in Product.objects.select_for_update().filter(
                id__in=product_ids
            ).order_by("id")
        }

        # Check stock again immediately before creating the order.
        for item in items:
            product = products.get(item["product_id"])

            if (
                product is None
                or not product.is_available
                or product.stock_quantity < item["quantity"]
            ):
                raise serializers.ValidationError({
                    "items": (
                        f"Insufficient stock for product "
                        f"{item['product_id']}. Please refresh your cart."
                    )
                })

        order = Order.objects.create(**validated_data)
        total = Decimal("0.00")

        for item in items:
            product = products[item["product_id"]]
            quantity = item["quantity"]
            price = product.price

            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price_at_purchase=price,
            )

            total += price * quantity

            product.stock_quantity -= quantity
            if product.stock_quantity == 0:
                product.is_available = False

            product.save(
                update_fields=["stock_quantity", "is_available"]
            )

        order.total_amount = total
        order.save(update_fields=["total_amount"])

        return order


class OrderItemOutputSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
    )
    subtotal = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = OrderItem
        fields = [
            "product",
            "product_name",
            "quantity",
            "price_at_purchase",
            "subtotal",
        ]


class OrderOutputSerializer(serializers.ModelSerializer):
    items = OrderItemOutputSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "customer_name",
            "phone_number",
            "email",
            "delivery_address",
            "status",
            "total_amount",
            "items",
            "created_at",
        ]
