
from decimal import Decimal, InvalidOperation

from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Product, WishlistItem
from .serializers import ProductSerializer, WishlistItemSerializer


class ProductListAPIView(generics.ListAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        # Include available and out-of-stock products.
        queryset = Product.objects.all()

        # 1. Search by product name.
        search = self.request.query_params.get("search", "").strip()

        if search:
            queryset = queryset.filter(name__icontains=search)

        # 2. Filter by category.
        category = self.request.query_params.get("category", "").strip()

        if category:
            valid_categories = {
                value for value, label in Product.CATEGORY_CHOICES
            }

            if category not in valid_categories:
                raise ValidationError({
                    "category": "Choose a valid category."
                })

            queryset = queryset.filter(category=category)

        # 3. Filter by size.
        size = self.request.query_params.get("size", "").strip()

        if size:
            valid_sizes = {
                value for value, label in Product.SIZE_CHOICES
            }

            if size not in valid_sizes:
                raise ValidationError({
                    "size": "Choose a valid size."
                })

            queryset = queryset.filter(size=size)

        # 4. Filter by minimum and maximum price.
        min_value = self.request.query_params.get(
            "min_price", ""
        ).strip()

        max_value = self.request.query_params.get(
            "max_price", ""
        ).strip()

        min_price = None
        max_price = None

        for parameter, value in [
            ("min_price", min_value),
            ("max_price", max_value),
        ]:
            if value:
                try:
                    price = Decimal(value)

                    if not price.is_finite() or price < 0:
                        raise InvalidOperation

                    if parameter == "min_price":
                        min_price = price
                    else:
                        max_price = price

                except InvalidOperation:
                    raise ValidationError({
                        parameter: "Enter a valid non-negative price."
                    })

        if min_price is not None and max_price is not None:
            if min_price > max_price:
                raise ValidationError({
                    "price": "Minimum price cannot exceed maximum price."
                })

        if min_price is not None:
            queryset = queryset.filter(price__gte=min_price)

        if max_price is not None:
            queryset = queryset.filter(price__lte=max_price)

        # 5. Sort the filtered products.
        sort = self.request.query_params.get("sort", "").strip()

        sort_options = {
            "price_asc": "price",
            "price_desc": "-price",
            "newest": "-created_at",
            "name_asc": "name",
        }

        if sort:
            if sort not in sort_options:
                raise ValidationError({
                    "sort": (
                        "Choose price_asc, price_desc, "
                        "newest, or name_asc."
                    )
                })

            queryset = queryset.order_by(sort_options[sort])

        return queryset


class WishlistAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wishlist_items = WishlistItem.objects.filter(
            user=request.user
        ).select_related("product")

        serializer = WishlistItemSerializer(
            wishlist_items,
            many=True,
            context={"request": request},
        )

        return Response(serializer.data)

    def post(self, request):
        product_id = request.data.get("product_id")

        if not product_id:
            return Response(
                {"error": "product_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prevent adding unavailable products to wishlist.
        product = get_object_or_404(
            Product,
            pk=product_id,
            is_available=True,
            stock_quantity__gt=0,
        )

        wishlist_item, created = WishlistItem.objects.get_or_create(
            user=request.user,
            product=product,
        )

        serializer = WishlistItemSerializer(
            wishlist_item,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=(
                status.HTTP_201_CREATED
                if created
                else status.HTTP_200_OK
            ),
        )


class WishlistItemDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, product_id):
        wishlist_item = get_object_or_404(
            WishlistItem,
            user=request.user,
            product_id=product_id,
        )

        wishlist_item.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )
