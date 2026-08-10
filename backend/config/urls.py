"""Root URL configuration. Every API route lives under /api/ inside its app."""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health", health),
    path("api/", include("apps.accounts.urls")),    # /api/auth/*, /api/users/*
    path("api/", include("apps.academics.urls")),   # /api/courses*, /api/departments, /api/faculty*
    path("api/", include("apps.materials.urls")),   # /api/materials/*
]
