
from django.db import models


class Product(models.Model):

    CATEGORY_CHOICES = [
        ("tops", "Tops"),
        ("shirts", "Shirts"),
        ("trousers", "Trousers"),
        ("dresses", "Dresses"),
        ("jackets", "Jackets"),
        ("skirts", "Skirts"),
        ("accessories", "Accessories"),
        ("other", "Other"),
    ]

    SIZE_CHOICES = [
        ("XS", "XS"),
        ("S", "S"),
        ("M", "M"),
        ("L", "L"),
        ("XL", "XL"),
        ("XXL", "XXL"),
        ("FREE", "Free Size"),
    ]

    CONDITION_CHOICES = [
        ("new", "New with Tags"),
        ("excellent", "Excellent"),
        ("very_good", "Very Good"),
        ("good", "Good"),
        ("fair", "Fair"),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField( max_length=20, choices=CATEGORY_CHOICES, default="other",)
    price = models.DecimalField(max_digits=10, decimal_places=2,)
    size = models.CharField(
        max_length=10,
        choices=SIZE_CHOICES,
    )

    condition = models.CharField(
        max_length=20,
        choices=CONDITION_CHOICES,
        default="very_good",
    )

    image = models.ImageField(
        upload_to="products/",
        blank=True,
        null=True,
    )

    stock_quantity = models.PositiveIntegerField(default=1)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Thrift Product"
        verbose_name_plural = "Thrift Products"
