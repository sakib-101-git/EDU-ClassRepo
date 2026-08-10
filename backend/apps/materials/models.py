import uuid

from django.conf import settings
from django.db import models


class Material(models.Model):
    """An uploaded note/file. The blob lives in Cloudflare R2 — only the URL is stored."""

    class Status(models.TextChoices):
        PENDING = "PENDING"
        APPROVED = "APPROVED"
        REJECTED = "REJECTED"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        "academics.Course", on_delete=models.CASCADE, related_name="materials"
    )
    faculty = models.ForeignKey(
        "academics.Faculty", on_delete=models.SET_NULL, blank=True, null=True, related_name="materials"
    )
    uploader = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="materials"
    )
    file_name = models.CharField(max_length=300)
    file_url = models.URLField(max_length=1000)
    file_size = models.BigIntegerField()
    content_type = models.CharField(max_length=100)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.file_name
