from django.urls import path
from .views import StitchingRequestCreateAPIView

urlpatterns = [
    path(
        "",
        StitchingRequestCreateAPIView.as_view(),
        name="stitching-request-create",
    ),
]