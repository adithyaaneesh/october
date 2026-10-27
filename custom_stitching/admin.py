
from django.contrib import admin
from .models import StitchingRequest


@admin.register(StitchingRequest)
class StitchingRequestAdmin(admin.ModelAdmin):

    list_display = (
        "customer_name",
        "phone_number",
        "garment_type",
        "status",
        "budget",
        "created_at",
    )

    list_filter = (
        "garment_type",
        "status",
        "created_at",
    )

    search_fields = (
        "customer_name",
        "phone_number",
        "email",
    )

    list_editable = ("status",)

    readonly_fields = (
        "created_at",
        "updated_at",
    )
