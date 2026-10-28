
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Product, WishlistItem
from .serializers import ProductSerializer, WishlistItemSerializer


class ProductListAPIView(generics.ListAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        return Product.objects.filter(
            is_available=True,
            stock_quantity__gt=0,
        )


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

        return Response(status=status.HTTP_204_NO_CONTENT)
