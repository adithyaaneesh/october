
from django.contrib import admin
from django.conf import settings
from .models import Product


LOW_STOCK_THRESHOLD = getattr(settings, "LOW_STOCK_THRESHOLD", 10)


class StockStatusFilter(admin.SimpleListFilter):
    title = "Stock status"
    parameter_name = "stock_status"

    def lookups(self, request, model_admin):
        return (
            ("low", "Low stock"),
            ("out", "Out of stock"),
            ("healthy", "Healthy stock"),
        )

    def queryset(self, request, queryset):
        if self.value() == "low":
            return queryset.filter(
                stock_quantity__gt=0,
                stock_quantity__lt=LOW_STOCK_THRESHOLD,
            )

        if self.value() == "out":
            return queryset.filter(stock_quantity=0)

        if self.value() == "healthy":
            return queryset.filter(
                stock_quantity__gte=LOW_STOCK_THRESHOLD
            )

        return queryset


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "category",
        "price",
        "size",
        "condition",
        "stock_quantity",
        "stock_status",
        "is_available",
    )

    list_filter = (
        "category",
        "size",
        "condition",
        "is_available",
        StockStatusFilter,
    )

    search_fields = ("name", "description")

    list_editable = (
        "price",
        "stock_quantity",
        "is_available",
    )

    @admin.display(description="Stock condition")
    def stock_status(self, obj):
        if obj.stock_quantity == 0:
            return "Out of stock"

        if obj.stock_quantity < LOW_STOCK_THRESHOLD:
            return "Low stock"

        return "Healthy"
