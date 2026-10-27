
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .serializers import OrderCreateSerializer, OrderOutputSerializer


class OrderCreateAPIView(generics.GenericAPIView):
    serializer_class = OrderCreateSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        return Response(
            OrderOutputSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )
