import uuid

from django.conf import settings
from django.db import models


class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return self.code


class Faculty(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    short_form = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=150)
    email = models.CharField(max_length=150, blank=True, null=True)
    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, blank=True, null=True, related_name="faculty"
    )

    class Meta:
        verbose_name_plural = "faculty"
        ordering = ["short_form"]

    def __str__(self):
        return f"{self.short_form} — {self.name}"


class Course(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=30, unique=True)
    title = models.CharField(max_length=250)
    credit_hours = models.FloatField(default=3.0)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name="courses")
    faculty = models.ManyToManyField(Faculty, blank=True, related_name="courses")

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return self.code


class Enrollment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enrollments"
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "course"], name="unique_user_course")
        ]

    def __str__(self):
        return f"{self.user} → {self.course}"
