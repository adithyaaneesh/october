
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Order
from products.models import Product
from .serializers import OrderCreateSerializer, OrderOutputSerializer


class OrderCreateAPIView(generics.GenericAPIView):
    serializer_class = OrderCreateSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Associate the order with the authenticated customer.
        order = serializer.save(user=request.user)

        return Response(
            OrderOutputSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )



class MyOrdersAPIView(generics.ListAPIView):
    serializer_class = OrderOutputSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects
            .filter(user=self.request.user)
            .prefetch_related("items__product")
            .order_by("-created_at")
        )



class CancelOrderAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        with transaction.atomic():
            order = get_object_or_404(
                Order.objects.select_for_update(),
                pk=pk,
                user=request.user,
            )

            # Prevent repeated cancellation and cancellation after shipping.
            if order.status in ["shipped", "completed", "cancelled"]:
                return Response(
                    {
                        "error": (
                            f"Order cannot be cancelled because its "
                            f"status is {order.status}."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Lock products and restore the quantities from this order.
            items = list(
                order.items.select_related("product").order_by("product_id")
            )

            for item in items:
                product = Product.objects.select_for_update().get(
                    pk=item.product_id
                )

                product.stock_quantity += item.quantity
                product.is_available = product.stock_quantity > 0

                product.save(
                    update_fields=["stock_quantity", "is_available"]
                )

            # Update the order only after restoring its stock.
            order.status = "cancelled"
            order.save(update_fields=["status", "updated_at"])

        return Response(
            {
                "message": "Order cancelled and product stock restored.",
                "order_id": order.id,
                "status": order.status,
            },
            status=status.HTTP_200_OK,
        )