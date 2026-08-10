from django.contrib import admin

from .models import Material


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ("file_name", "course", "faculty", "uploader", "status", "created_at")
    list_filter = ("status", "course__department")
    search_fields = ("file_name",)
