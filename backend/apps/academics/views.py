"""Courses, departments, faculty, and enrollment endpoints."""
import uuid

from django.db.models import Q
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdmin
from apps.common.exceptions import Conflict

from .models import Course, Department, Enrollment, Faculty
from .serializers import CourseSerializer, DepartmentSerializer, FacultySerializer


def _course_queryset():
    return Course.objects.select_related("department").prefetch_related("faculty__department")


def _get_course_or_404(identifier):
    """Look up a course by UUID, or by code (URL form `cse-111` → `CSE 111`)."""
    queryset = _course_queryset()
    try:
        return queryset.get(id=uuid.UUID(str(identifier)))
    except (ValueError, Course.DoesNotExist):
        pass
    course = queryset.filter(code__iexact=str(identifier).replace("-", " ")).first()
    if course is None:
        raise NotFound("Course not found")
    return course


class CourseListCreateView(ListAPIView):
    """GET  /api/courses         — public, paginated, ?dept= & ?search=
    POST /api/courses            — admin only, creates a course"""

    serializer_class = CourseSerializer

    def get_permissions(self):
        return [IsAdmin()] if self.request.method == "POST" else [AllowAny()]

    def get_queryset(self):
        queryset = _course_queryset().order_by("code")
        dept = self.request.query_params.get("dept")
        search = self.request.query_params.get("search")
        if dept:
            queryset = queryset.filter(department__code__iexact=dept)
        if search:
            queryset = queryset.filter(Q(code__icontains=search) | Q(title__icontains=search))
        return queryset

    def post(self, request):
        code = (request.data.get("code") or "").strip().upper()
        title = (request.data.get("title") or "").strip()
        dept_code = (request.data.get("department_code") or "").strip().upper()
        credit_hours = request.data.get("credit_hours") or 3.0

        if not code or not title or not dept_code:
            raise ValidationError("code, title and departmentCode are required")
        if Course.objects.filter(code__iexact=code).exists():
            raise Conflict(f"Course {code} already exists")

        department = Department.objects.filter(code=dept_code).first()
        if department is None:
            raise ValidationError(f"Unknown department: {dept_code}")

        course = Course.objects.create(
            code=code, title=title, department=department, credit_hours=float(credit_hours)
        )
        return Response(CourseSerializer(course).data, status=status.HTTP_201_CREATED)


class CourseDetailView(APIView):
    """GET (public) or DELETE (admin) a single course, by UUID or code."""

    def get_permissions(self):
        return [IsAdmin()] if self.request.method == "DELETE" else [AllowAny()]

    def get(self, request, identifier):
        return Response(CourseSerializer(_get_course_or_404(identifier)).data)

    def delete(self, request, identifier):
        _get_course_or_404(identifier).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EnrollView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, identifier):
        course = _get_course_or_404(identifier)
        _, created = Enrollment.objects.get_or_create(user=request.user, course=course)
        if not created:
            raise Conflict("Already enrolled in this course")
        return Response({"message": f"Enrolled in {course.code}"})

    def delete(self, request, identifier):
        course = _get_course_or_404(identifier)
        Enrollment.objects.filter(user=request.user, course=course).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EnrolledCoursesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        courses = _course_queryset().filter(enrollments__user=request.user).order_by("code")
        return Response(CourseSerializer(courses, many=True).data)


class DepartmentListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        departments = Department.objects.all()
        return Response(DepartmentSerializer(departments, many=True).data)


class FacultyListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = Faculty.objects.select_related("department").all()
        dept = request.query_params.get("dept")
        if dept:
            queryset = queryset.filter(department__code__iexact=dept)
        return Response(FacultySerializer(queryset, many=True).data)


class FacultyDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, faculty_id):
        faculty = Faculty.objects.select_related("department").filter(id=faculty_id).first()
        if faculty is None:
            raise NotFound("Faculty not found")
        return Response(FacultySerializer(faculty).data)
