from rest_framework import serializers

from apps.academics.serializers import CourseSerializer, FacultySerializer
from apps.accounts.serializers import UserSummarySerializer

from .models import Material


class MaterialSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    faculty = FacultySerializer(read_only=True)
    uploader = UserSummarySerializer(read_only=True)

    class Meta:
        model = Material
        fields = [
            "id", "course", "faculty", "uploader",
            "file_name", "file_url", "file_size", "content_type",
            "status", "created_at",
        ]
