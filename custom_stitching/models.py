
from django.db import models


class StitchingRequest(models.Model):

    GARMENT_CHOICES = [
        ("blouse", "Blouse"),
        ("dress", "Dress"),
        ("shirt", "Shirt"),
        ("trousers", "Trousers"),
        ("skirt", "Skirt"),
        ("kurti", "Kurti"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending Review"),
        ("contacted", "Customer Contacted"),
        ("quoted", "Price Quoted"),
        ("confirmed", "Order Confirmed"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    customer_name = models.CharField(max_length=150)

    phone_number = models.CharField(max_length=20)

    email = models.EmailField(blank=True)

    garment_type = models.CharField(
        max_length=20,
        choices=GARMENT_CHOICES,
    )

    description = models.TextField(
        help_text="Describe the design, fabric and style you want."
    )

    measurements = models.JSONField(
        default=dict,
        blank=True,
        help_text="Measurements in cm or inches, as specified.",
    )

    fit_preference = models.CharField(
        max_length=100,
        blank=True,
    )

    reference_image = models.ImageField(
        upload_to="stitching_references/",
        blank=True,
        null=True,
    )

    budget = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )

    admin_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            f"{self.customer_name} - "
            f"{self.get_garment_type_display()}"
        )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Stitching Request"
        verbose_name_plural = "Stitching Requests"
