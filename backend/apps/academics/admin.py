from django.contrib import admin

from .models import Course, Department, Enrollment, Faculty


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("code", "name")


@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ("short_form", "name", "department", "email")
    list_filter = ("department",)
    search_fields = ("short_form", "name")


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("code", "title", "department", "credit_hours")
    list_filter = ("department",)
    search_fields = ("code", "title")


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("user", "course", "enrolled_at")
