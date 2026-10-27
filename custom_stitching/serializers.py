from rest_framework import serializers
from .models import StitchingRequest


class StitchingRequestSerializer(serializers.ModelSerializer):

    class Meta:
        model = StitchingRequest
        fields = [
            "id",
            "customer_name",
            "phone_number",
            "email",
            "garment_type",
            "description",
            "measurements",
            "fit_preference",
            "reference_image",
            "budget",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]