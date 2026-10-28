from django.urls import path
from .views import (
    ProductListAPIView,
    WishlistAPIView,
    WishlistItemDeleteAPIView,
)

urlpatterns = [
    path("", ProductListAPIView.as_view(), name="product-list"),

    path("wishlist/", WishlistAPIView.as_view(), name="wishlist"),

    path(
        "wishlist/<int:product_id>/",
        WishlistItemDeleteAPIView.as_view(),
        name="wishlist-delete",
    ),
]
