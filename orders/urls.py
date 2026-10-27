from django.urls import path
from .views import (
    OrderCreateAPIView,
    MyOrdersAPIView,
    CancelOrderAPIView,
)

urlpatterns = [
    path("", OrderCreateAPIView.as_view(), name="order-create"),
    path("my/", MyOrdersAPIView.as_view(), name="my-orders"),
    path("<int:pk>/cancel/", CancelOrderAPIView.as_view(),name="cancel-order"),
]