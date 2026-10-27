from rest_framework import status
from rest_framework.views import APIView
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Order
from .serializers import OrderCreateSerializer, OrderOutputSerializer
from .services import cancel_order, OrderCancellationError

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
        try:
            order = cancel_order(pk, user=request.user)

        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        except OrderCancellationError as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "Order cancelled and product stock restored.",
                "order_id": order.id,
                "status": order.status,
            },
            status=status.HTTP_200_OK,
        )
