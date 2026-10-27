
from django.contrib import admin, messages
from django.db import transaction
from .services import cancel_order, OrderCancellationError
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False

    fields = (
        "product",
        "quantity",
        "price_at_purchase",
        "display_subtotal",
    )

    readonly_fields = (
        "product",
        "quantity",
        "price_at_purchase",
        "display_subtotal",
    )

    @admin.display(description="Subtotal")
    def display_subtotal(self, obj):
        if obj.price_at_purchase is None or obj.quantity is None:
            return "Missing price or quantity"

        return obj.subtotal


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "customer_name",
        "phone_number",
        "email",
        "status",
        "total_amount",
        "created_at",
    )

    list_filter = ("status", "created_at")

    search_fields = (
        "customer_name",
        "phone_number",
        "email",
    )

    ordering = ("-created_at",)

    readonly_fields = (
        "user",
        "customer_name",
        "phone_number",
        "email",
        "delivery_address",
        "total_amount",
        "created_at",
        "updated_at",
        "status",
    )

    inlines = [OrderItemInline]

    actions = [
        "mark_confirmed",
        "mark_processing",
        "mark_shipped",
        "mark_completed",
        "cancel_orders_and_restore_stock",
    ]

    def update_status(self, request, queryset, new_status):
        allowed = {
            "confirmed": ("pending",),
            "processing": ("confirmed",),
            "shipped": ("processing",),
            "completed": ("shipped",),
        }

        updated = 0

        for selected_order in queryset:
            with transaction.atomic():
                order = (
                    Order.objects.select_for_update()
                    .filter(pk=selected_order.pk)
                    .first()
                )

                if order is None:
                    continue

                if order.status not in allowed.get(new_status, ()):
                    continue

                order.status = new_status
                order.save(update_fields=["status", "updated_at"])
                updated += 1

        self.message_user(
            request,
            f"Updated {updated} order(s) to {new_status}.",
            level=messages.SUCCESS,
        )

    @admin.action(description="Mark selected orders as Confirmed")
    def mark_confirmed(self, request, queryset):
        self.update_status(request, queryset, "confirmed")

    @admin.action(description="Mark selected orders as Processing")
    def mark_processing(self, request, queryset):
        self.update_status(request, queryset, "processing")

    @admin.action(description="Mark selected orders as Shipped")
    def mark_shipped(self, request, queryset):
        self.update_status(request, queryset, "shipped")

    @admin.action(description="Mark selected orders as Completed")
    def mark_completed(self, request, queryset):
        self.update_status(request, queryset, "completed")

    @admin.action(
        description="Cancel eligible orders and restore product stock"
    )
    
    @admin.action(
        description="Cancel eligible orders and restore product stock"
    )
    def cancel_orders_and_restore_stock(self, request, queryset):
        cancelled = 0
        skipped = 0

        for selected_order in queryset:
            try:
                cancel_order(selected_order.pk)
                cancelled += 1

            except (Order.DoesNotExist, OrderCancellationError):
                skipped += 1

        if cancelled:
            self.message_user(
                request,
                f"Cancelled {cancelled} order(s) and restored stock.",
                level=messages.SUCCESS,
            )

        if skipped:
            self.message_user(
                request,
                f"Skipped {skipped} order(s): status or order data "
                "does not permit cancellation.",
                level=messages.WARNING,
            )



@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "product",
        "quantity",
        "price_at_purchase",
    )

    search_fields = (
        "order__customer_name",
        "order__email",
        "product__name",
    )

    readonly_fields = (
        "order",
        "product",
        "quantity",
        "price_at_purchase",
    )
