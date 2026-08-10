"""
Django settings for EDU ClassRepo.

Every secret and environment-specific value comes from environment variables
(loaded from backend/.env in development). See .env.example for the full list.
"""
import os
from pathlib import Path

import dj_database_url
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


# ── Core ─────────────────────────────────────────────────────────────────────

SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-insecure-key-do-not-use-in-production")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "apps.accounts",
    "apps.academics",
    "apps.materials",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ── Database ─────────────────────────────────────────────────────────────────
# PostgreSQL only. There is deliberately NO SQLite fallback: a silent fallback
# let local runs pass against an engine production never uses, and it hid a
# missing DATABASE_URL instead of reporting it.
#
# DATABASE_URL example: postgresql://user:password@host:5432/dbname
# Supabase: use the SESSION POOLER url (IPv4-compatible), not the direct one.

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if not DATABASE_URL:
    raise ImproperlyConfigured(
        "DATABASE_URL is not set. EDU ClassRepo runs on PostgreSQL only - set it "
        "in backend/.env to your Supabase session-pooler connection string."
    )
if DATABASE_URL.startswith("sqlite"):
    raise ImproperlyConfigured(
        "SQLite is no longer supported. Point DATABASE_URL at PostgreSQL."
    )

DATABASES = {"default": dj_database_url.parse(DATABASE_URL, conn_max_age=600)}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
]


# ── REST framework ───────────────────────────────────────────────────────────
# camelCase renderer/parser + Spring-style pagination keep the JSON contract
# identical to the old Spring Boot API, so the Next.js frontend needs no changes.

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.accounts.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "djangorestframework_camel_case.render.CamelCaseJSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "djangorestframework_camel_case.parser.CamelCaseJSONParser",
        "djangorestframework_camel_case.parser.CamelCaseFormParser",
        "djangorestframework_camel_case.parser.CamelCaseMultiPartParser",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.common.pagination.SpringPagePagination",
    "PAGE_SIZE": 20,
    "EXCEPTION_HANDLER": "apps.common.exceptions.exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [],
    "DEFAULT_THROTTLE_RATES": {
        "auth": "20/min",   # login / register / refresh
        "otp": "5/min",     # OTP send + verify attempts
    },
    "UNAUTHENTICATED_USER": None,
}


# ── Auth tokens (same contract as the old Spring backend) ────────────────────

JWT_SECRET = os.getenv("JWT_SECRET", SECRET_KEY)
JWT_ACCESS_TTL_SECONDS = 15 * 60          # access token: 15 minutes
REFRESH_TOKEN_TTL_DAYS = 7                # refresh token: 7 days, rotated on use
OTP_TTL_MINUTES = 10                      # email verification code: 10 minutes


# ── App-specific settings ────────────────────────────────────────────────────

EMAIL_ALLOWED_DOMAIN = os.getenv("EMAIL_ALLOWED_DOMAIN", "eastdelta.edu.bd")

# OTP emails are sent with Django's built-in SMTP email framework.
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv("MAIL_USERNAME", "")
EMAIL_HOST_PASSWORD = os.getenv("MAIL_PASSWORD", "")
DEFAULT_FROM_EMAIL = f"EDU ClassRepo <{EMAIL_HOST_USER or 'noreply@eastdelta.edu.bd'}>"

# Cloudflare R2 (S3-compatible object storage) — file blobs never touch the DB
R2_ENDPOINT = os.getenv("R2_ENDPOINT", "")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY", "")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY", "")
R2_BUCKET = os.getenv("R2_BUCKET", "")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "")

MAX_UPLOAD_SIZE = 50 * 1024 * 1024        # 50 MB, same as the old backend

# ── Admin accounts ───────────────────────────────────────────────────────────
# Two fixed admin identities, created by `manage.py seed_data` on every boot.
# EMAIL and PASSWORD are required per slot and have NO fallback: a slot missing
# either is dropped, because a guessable default superuser on a public URL is
# worse than no superuser. NAME and ID are cosmetic and may be left unset.
#
# Departments, faculty and courses are deliberately NOT seeded — they are
# entered by hand at /admin/ so admin edits survive every deploy and restart.

ADMIN_SLOTS = (1, 2)


def _admin_account(slot):
    email = os.getenv(f"ADMIN_EMAIL_{slot}", "").strip()
    password = os.getenv(f"ADMIN_PASSWORD_{slot}", "")
    if not email or not password:
        return None
    return {
        "slot": slot,
        "email": email,
        "password": password,
        "name": os.getenv(f"ADMIN_NAME_{slot}", "").strip() or email.split("@")[0],
        "student_id": os.getenv(f"ADMIN_ID_{slot}", "").strip() or f"ADM-{slot:03d}",
    }


ADMIN_ACCOUNTS = [a for a in (_admin_account(s) for s in ADMIN_SLOTS) if a]


# ── CORS ─────────────────────────────────────────────────────────────────────

CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
CORS_ALLOW_CREDENTIALS = True


# ── Static files (Django admin) ──────────────────────────────────────────────

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}


# ── Production security ──────────────────────────────────────────────────────

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "true").lower() == "true"
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True


# ── I18N / time ──────────────────────────────────────────────────────────────

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
