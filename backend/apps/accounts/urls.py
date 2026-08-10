from django.urls import path

from . import views

urlpatterns = [
    path("auth/register", views.RegisterView.as_view()),
    path("auth/verify-email", views.VerifyEmailView.as_view()),
    path("auth/resend-otp", views.ResendOtpView.as_view()),
    path("auth/login", views.LoginView.as_view()),
    path("auth/refresh", views.RefreshView.as_view()),
    path("auth/logout", views.LogoutView.as_view()),
    path("users/me", views.MeView.as_view()),
    path("users/me/profile-pic", views.ProfilePicView.as_view()),
]
