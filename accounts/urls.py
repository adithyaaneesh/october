from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import RegisterAPIView, ProfileAPIView, ChangePasswordAPIView

urlpatterns = [
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("profile/", ProfileAPIView.as_view(), name="profile"),
    path("change-password/",ChangePasswordAPIView.as_view(),name="change-password"),
]