# Production image for the Django backend (Render deploys this).
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Collect static files for the Django admin (served by WhiteNoise).
# DATABASE_URL is required by settings.py but unavailable at build time;
# collectstatic never opens a connection, so a throwaway DSN is enough to
# satisfy the import-time check. The real one is injected at runtime.
RUN SECRET_KEY=build-time-only \
    DATABASE_URL=postgresql://build:build@localhost:5432/build \
    python manage.py collectstatic --noinput

RUN addgroup --system app && adduser --system --ingroup app app
USER app

EXPOSE 8000

# migrate + ensure the admin accounts on every boot (both idempotent), then serve.
# seed_data creates ONLY the admins — departments/faculty/courses are entered at
# /admin/. It exits non-zero when no admin is configured, which aborts the boot.
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py seed_data && gunicorn config.wsgi --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120"]
