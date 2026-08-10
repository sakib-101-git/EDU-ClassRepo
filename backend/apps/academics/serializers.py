from rest_framework import serializers

from .models import Course, Department, Faculty


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "code", "name"]


class FacultySerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)

    class Meta:
        model = Faculty
        fields = ["id", "short_form", "name", "email", "department"]


class CourseSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    faculty = FacultySerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = ["id", "code", "title", "credit_hours", "department", "faculty"]
