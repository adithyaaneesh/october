from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import StitchingRequest
from .serializers import StitchingRequestSerializer


class StitchingRequestCreateAPIView(generics.CreateAPIView):
    queryset = StitchingRequest.objects.all()
    serializer_class = StitchingRequestSerializer
    permission_classes = [AllowAny]