"""Material (note) endpoints: browse, upload, and admin moderation."""
from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import NotFound, ParseError, PermissionDenied, ValidationError
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academics.models import Course, Faculty
from apps.accounts.permissions import IsAdmin

from . import storage
from .models import Material
from .serializers import MaterialSerializer

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg",
    "image/png",
    "image/gif",
}


def _material_queryset():
    return Material.objects.select_related(
        "course__department", "faculty__department", "uploader__department"
    ).prefetch_related("course__faculty")


def _get_material_or_404(material_id):
    material = _material_queryset().filter(id=material_id).first()
    if material is None:
        raise NotFound("Material not found")
    return material


class CourseMaterialsView(ListAPIView):
    """GET /api/materials/course/{courseId} — public sees APPROVED, admin sees all."""

    permission_classes = [AllowAny]
    serializer_class = MaterialSerializer

    def get_queryset(self):
        queryset = _material_queryset().filter(course_id=self.kwargs["course_id"])

        is_admin = bool(self.request.user and getattr(self.request.user, "is_admin", False))
        if not is_admin:
            queryset = queryset.filter(status=Material.Status.APPROVED)

        faculty_id = self.request.query_params.get("facultyId")
        if faculty_id:
            queryset = queryset.filter(faculty_id=faculty_id)
        return queryset


class PendingMaterialsView(ListAPIView):
    """GET /api/materials/pending — admin approval queue."""

    permission_classes = [IsAdmin]
    serializer_class = MaterialSerializer

    def get_queryset(self):
        return _material_queryset().filter(status=Material.Status.PENDING)


class UploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get("file")
        if file is None or file.size == 0:
            raise ParseError("No file provided")
        if file.size > settings.MAX_UPLOAD_SIZE:
            raise ParseError("File is too large (max 50 MB)")
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise ParseError("File type not allowed (PDF, Word, PowerPoint, or image)")

        course = Course.objects.filter(id=request.data.get("course_id")).first()
        if course is None:
            raise ValidationError("Unknown course")

        faculty = self._resolve_faculty(request)
        file_url = storage.upload_material(file, course.id, request.user.id)

        # Admin uploads go live immediately; student uploads await approval.
        is_admin = request.user.is_admin
        Material.objects.create(
            course=course,
            faculty=faculty,
            uploader=request.user,
            file_name=file.name,
            file_url=file_url,
            file_size=file.size,
            content_type=file.content_type,
            status=Material.Status.APPROVED if is_admin else Material.Status.PENDING,
        )
        return Response(
            {
                "message": "Uploaded" if is_admin else "Uploaded — awaiting admin approval",
                "status": Material.Status.APPROVED if is_admin else Material.Status.PENDING,
            },
            status=status.HTTP_201_CREATED,
        )

    @staticmethod
    def _resolve_faculty(request):
        faculty_id = request.data.get("faculty_id")
        if faculty_id:
            return Faculty.objects.filter(id=faculty_id).first()

        short_form = (request.data.get("faculty_short_form") or "").strip()
        name = (request.data.get("faculty_name") or "").strip()
        if short_form and name:
            faculty, _ = Faculty.objects.get_or_create(
                short_form=short_form, defaults={"name": name}
            )
            return faculty
        return None


class ApproveView(APIView):
    permission_classes = [IsAdmin]

    def put(self, request, material_id):
        material = _get_material_or_404(material_id)
        material.status = Material.Status.APPROVED
        material.save(update_fields=["status"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class RejectView(APIView):
    permission_classes = [IsAdmin]

    def put(self, request, material_id):
        material = _get_material_or_404(material_id)
        storage.delete_by_url(material.file_url)
        material.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RenameView(APIView):
    permission_classes = [IsAdmin]

    def put(self, request, material_id):
        file_name = (request.data.get("file_name") or "").strip()
        if not file_name:
            raise ValidationError("fileName is required")
        material = _get_material_or_404(material_id)
        material.file_name = file_name
        material.save(update_fields=["file_name"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class DeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, material_id):
        material = _get_material_or_404(material_id)
        if material.uploader_id != request.user.id and not request.user.is_admin:
            raise PermissionDenied("You can only delete your own uploads")
        storage.delete_by_url(material.file_url)
        material.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
