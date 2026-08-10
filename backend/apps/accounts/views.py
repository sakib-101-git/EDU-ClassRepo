"""Auth + user endpoints. Paths and JSON shapes mirror the old Spring API."""
import secrets
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import NotFound, ParseError, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.academics.models import Department
from apps.common.exceptions import Conflict
from apps.materials import storage

from . import emails, tokens
from .models import OtpToken, RefreshToken, User
from .serializers import RegisterSerializer, UserSummarySerializer

ALLOWED_PROFILE_PIC_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


def _issue_otp(email):
    """Create a fresh 6-digit OTP for this email and send it (async)."""
    # Opportunistic cleanup — replaces the old backend's scheduled purge job.
    OtpToken.objects.filter(expires_at__lt=timezone.now() - timedelta(hours=1)).delete()

    otp = f"{secrets.randbelow(1_000_000):06d}"
    OtpToken.objects.create(
        email=email,
        otp_code=otp,
        expires_at=timezone.now() + timedelta(minutes=settings.OTP_TTL_MINUTES),
    )
    emails.send_otp_email(email, otp)


def _otp_sent_response(email, http_status=status.HTTP_200_OK):
    return Response(
        {"email": email, "message": "A verification code has been sent to your email."},
        status=http_status,
    )


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp"

    def post(self, request):
        data = RegisterSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        fields = data.validated_data

        email = fields["email"].lower()
        domain = settings.EMAIL_ALLOWED_DOMAIN
        if not email.endswith("@" + domain):
            raise ValidationError(f"Only @{domain} emails are allowed")

        existing = User.objects.filter(email=email).first()
        if existing is not None:
            if existing.email_verified:
                raise Conflict("An account with this email already exists")
            # Unverified account re-registering: just send a fresh code.
            _issue_otp(email)
            return _otp_sent_response(email)

        department = Department.objects.filter(
            code=(fields.get("department_code") or "CSE").upper()
        ).first()

        User.objects.create_user(
            email=email,
            password=fields["password"],
            name=fields["name"],
            student_id=fields.get("student_id") or None,
            gender=fields.get("gender") or None,
            semester_number=fields.get("semester_number"),
            department=department,
        )
        _issue_otp(email)
        return _otp_sent_response(email, status.HTTP_201_CREATED)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp"

    def post(self, request):
        email = (request.data.get("email") or "").lower()
        otp = request.data.get("otp") or ""

        token = (
            OtpToken.objects.filter(email=email, used=False)
            .order_by("-created_at")
            .first()
        )
        if token is None or token.is_expired() or token.otp_code != otp:
            raise ValidationError("Invalid or expired verification code")

        user = User.objects.filter(email=email).first()
        if user is None:
            raise ValidationError("No account found for this email")

        user.email_verified = True
        user.save(update_fields=["email_verified"])
        OtpToken.objects.filter(email=email).delete()
        return Response(tokens.auth_response(user))


class ResendOtpView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp"

    def post(self, request):
        email = (request.data.get("email") or "").lower()
        user = User.objects.filter(email=email).first()
        if user is None:
            raise ValidationError("No account found for this email")
        if user.email_verified:
            raise ValidationError("This email is already verified")
        _issue_otp(email)
        return _otp_sent_response(email)


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        email = (request.data.get("email") or "").lower()
        password = request.data.get("password") or ""

        user = User.objects.select_related("department").filter(email=email).first()
        if user is None or not user.check_password(password):
            raise ValidationError("Invalid email or password")
        if not user.email_verified:
            # The frontend parses this exact format to redirect to the verify page.
            raise ValidationError(f"EMAIL_NOT_VERIFIED:{user.email}")

        return Response(tokens.auth_response(user))


class RefreshView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        value = request.data.get("refresh_token") or request.data.get("refreshToken") or ""
        token = RefreshToken.objects.select_related("user__department").filter(token=value).first()
        if token is None:
            raise ValidationError("Invalid refresh token")

        user, expired = token.user, token.is_expired()

        # Single-use gate: the DELETE is the claim, NOT the SELECT above. Postgres
        # serialises concurrent DELETEs on a row, so exactly one caller sees
        # rowcount 1 and every loser sees 0. Treating the SELECT as the gate lets
        # two simultaneous refreshes of the same token both mint a valid pair
        # (reproduced with two threads before this was added).
        # RefreshToken has no reverse FKs and no delete signals, so this takes
        # Django's fast-delete path and the count is the real DB rowcount.
        deleted, _ = RefreshToken.objects.filter(pk=token.pk).delete()
        if not deleted:
            raise ValidationError("Invalid refresh token")

        if expired:
            raise ValidationError("Refresh token expired")
        return Response(tokens.auth_response(user))


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        value = request.data.get("refresh_token") or request.data.get("refreshToken")
        if value:
            RefreshToken.objects.filter(token=value).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSummarySerializer(request.user).data)


class ProfilePicView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get("file")
        if file is None or file.size == 0:
            raise ParseError("No file provided")
        if file.size > settings.MAX_UPLOAD_SIZE:
            raise ParseError("File is too large (max 50 MB)")
        if file.content_type not in ALLOWED_PROFILE_PIC_TYPES:
            raise ParseError("Profile picture must be an image (JPEG/PNG/GIF/WebP)")

        url = storage.upload_profile_pic(file, request.user.id)
        request.user.profile_pic_url = url
        request.user.save(update_fields=["profile_pic_url"])
        return Response({"profilePicUrl": url})
