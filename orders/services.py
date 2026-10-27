
from django.db import transaction

from products.models import Product
from .models import Order, OrderItem


class OrderCancellationError(Exception):
    """Raised when an order cannot be cancelled."""


@transaction.atomic
def cancel_order(order_id, user=None):
    """
    Cancel an eligible order and restore its product stock.

    If user is provided, only that user's order can be cancelled.
    Admin cancellation can call this function without a user.
    """

    orders = Order.objects.select_for_update().filter(pk=order_id)

    if user is not None:
        orders = orders.filter(user=user)

    order = orders.first()

    if order is None:
        raise Order.DoesNotExist

    allowed_statuses = ("pending", "confirmed", "processing")

    if order.status not in allowed_statuses:
        raise OrderCancellationError(
            f"Order cannot be cancelled because its status is "
            f"{order.status}."
        )

    items = list(
        OrderItem.objects.filter(order=order).order_by("product_id")
    )

    if not items:
        raise OrderCancellationError(
            "This order has no items. Stock was not changed."
        )

    if any(item.quantity is None or item.quantity <= 0 for item in items):
        raise OrderCancellationError(
            "Order contains invalid item quantities. Stock was not changed."
        )

    product_ids = sorted({item.product_id for item in items})

    products = {
        product.pk: product
        for product in (
            Product.objects.select_for_update()
            .filter(pk__in=product_ids)
            .order_by("pk")
        )
    }

    if len(products) != len(product_ids):
        raise OrderCancellationError(
            "A product in this order could not be found. Stock was not changed."
        )

    # Restore stock only after all validation and locking succeeds.
    for item in items:
        product = products[item.product_id]
        product.stock_quantity += item.quantity
        product.is_available = product.stock_quantity > 0
        product.save(
            update_fields=["stock_quantity", "is_available"]
        )

    order.status = "cancelled"
    order.save(update_fields=["status", "updated_at"])

    return order
