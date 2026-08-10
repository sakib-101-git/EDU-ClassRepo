"""Cloudflare R2 file storage (S3-compatible, via boto3).

File blobs never touch the database — only the public URL is stored.
Key scheme and URL format are identical to the old backend, so existing
file URLs remain valid.
"""
import logging
import uuid
from pathlib import Path

import boto3
from botocore.config import Config
from django.conf import settings

logger = logging.getLogger(__name__)


def _client():
    return boto3.client(
        "s3",
        endpoint_url=settings.R2_ENDPOINT,
        aws_access_key_id=settings.R2_ACCESS_KEY,
        aws_secret_access_key=settings.R2_SECRET_KEY,
        region_name="auto",
        config=Config(s3={"addressing_style": "path"}),  # required by R2
    )


def _upload(file, key):
    _client().upload_fileobj(
        file,
        settings.R2_BUCKET,
        key,
        ExtraArgs={"ContentType": file.content_type or "application/octet-stream"},
    )
    return f"{settings.R2_PUBLIC_URL}/{key}"


def upload_material(file, course_id, uploader_id):
    ext = Path(file.name).suffix
    return _upload(file, f"materials/{course_id}/{uploader_id}/{uuid.uuid4()}{ext}")


def upload_profile_pic(file, user_id):
    ext = Path(file.name).suffix
    # Fixed key per user — a new upload overwrites the old picture.
    return _upload(file, f"profiles/{user_id}{ext}")


def delete_by_url(file_url):
    """Best-effort delete: a failed R2 delete is logged, never raised,
    so the DB row can still be removed (same behavior as the old backend)."""
    prefix = f"{settings.R2_PUBLIC_URL}/"
    if not file_url or not file_url.startswith(prefix):
        return
    try:
        _client().delete_object(Bucket=settings.R2_BUCKET, Key=file_url.removeprefix(prefix))
    except Exception:
        logger.warning("Failed to delete R2 object for %s", file_url, exc_info=True)
