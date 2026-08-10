import jwt
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from . import tokens
from .models import User


class JWTAuthentication(BaseAuthentication):
    """Reads `Authorization: Bearer <access token>` and resolves the user.

    Returns 401 on a bad/expired token so the frontend's automatic
    refresh-and-retry logic (frontend/lib/api.ts) kicks in.
    """

    def authenticate(self, request):
        header = request.META.get("HTTP_AUTHORIZATION", "")
        if not header.startswith("Bearer "):
            return None

        token = header.removeprefix("Bearer ").strip()
        try:
            payload = tokens.decode_access_token(token)
        except jwt.PyJWTError:
            raise AuthenticationFailed("Invalid or expired token")

        try:
            user = User.objects.select_related("department").get(id=payload["sub"])
        except (User.DoesNotExist, KeyError, ValueError):
            raise AuthenticationFailed("User not found")

        return (user, token)

    def authenticate_header(self, request):
        # Makes DRF answer unauthenticated requests with 401 (not 403).
        return "Bearer"
