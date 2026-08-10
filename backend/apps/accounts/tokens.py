"""JWT access tokens + opaque refresh tokens.

Same contract as the old Spring backend:
- Access token: HS256 JWT, 15 minutes, claims sub/email/role/type.
- Refresh token: random 64-char hex string stored in the DB, 7 days,
  single-use — every refresh deletes the old token and issues a new pair.
"""
import secrets
from datetime import timedelta

import jwt
from django.conf import settings
from django.utils import timezone

from .models import RefreshToken


def create_access_token(user):
    now = timezone.now()
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=settings.JWT_ACCESS_TTL_SECONDS)).timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def decode_access_token(token):
    """Returns the payload, or raises jwt.PyJWTError if invalid/expired."""
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("Not an access token")
    return payload


def create_refresh_token(user):
    return RefreshToken.objects.create(
        user=user,
        token=secrets.token_hex(32),
        expires_at=timezone.now() + timedelta(days=settings.REFRESH_TOKEN_TTL_DAYS),
    )


def auth_response(user):
    """The AuthResponse JSON shape the frontend expects after login/verify/refresh."""
    from .serializers import UserSummarySerializer

    return {
        "accessToken": create_access_token(user),
        "refreshToken": create_refresh_token(user).token,
        "tokenType": "Bearer",
        "expiresIn": settings.JWT_ACCESS_TTL_SECONDS,
        "user": UserSummarySerializer(user).data,
    }
