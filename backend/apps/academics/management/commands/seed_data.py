"""Ensure the configured admin accounts exist. Nothing else is seeded.

Departments, faculty and courses are entered by hand through the Django admin
site at /admin/ — deliberately NOT seeded. An earlier version of this command
re-applied a hardcoded catalog with `update_or_create` on every container boot,
which silently reverted any admin edit to a seeded row on each deploy.

Idempotent: keyed on email via `get_or_create`, so an existing account is never
touched — a password rotated after creation is not reset by the next redeploy.

Fails hard (non-zero exit, which aborts the container CMD) when no admin slot is
configured at all; warns and continues when only one of the two is configured.
"""
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.accounts.models import User


class Command(BaseCommand):
    help = "Ensure the configured admin accounts exist (idempotent). Seeds nothing else."

    @transaction.atomic
    def handle(self, *args, **options):
        accounts = settings.ADMIN_ACCOUNTS
        if not accounts:
            raise CommandError(
                "No admin account is configured - refusing to start. "
                "Set ADMIN_EMAIL_1 and ADMIN_PASSWORD_1 (optionally the _2 pair too)."
            )

        configured = {a["slot"] for a in accounts}
        for slot in settings.ADMIN_SLOTS:
            if slot not in configured:
                self.stderr.write(self.style.WARNING(
                    f"Admin slot {slot} is not configured "
                    f"(ADMIN_EMAIL_{slot} / ADMIN_PASSWORD_{slot} missing) - skipped."
                ))

        for account in accounts:
            self._ensure_admin(account)

    def _ensure_admin(self, account):
        user, created = User.objects.get_or_create(
            email=account["email"],
            defaults={
                "name": account["name"],
                "student_id": account["student_id"],
                "role": User.Role.ADMIN,
                "is_staff": True,       # gate for the Django admin site at /admin/
                "is_superuser": True,   # full model permissions inside /admin/
                "email_verified": True,  # LoginView rejects unverified accounts
            },
        )

        if created:
            # The row is created password-less, then hashed here inside the same
            # transaction — it is not visible to any other connection until commit.
            user.set_password(account["password"])
            user.save(update_fields=["password"])
            self.stdout.write(self.style.SUCCESS(
                f"Created admin slot {account['slot']}: {user.email} "
                f"(name={user.name!r}, id={user.student_id!r})"
            ))
            return

        self.stdout.write(
            f"Admin slot {account['slot']}: {user.email} already exists - left unchanged."
        )

        # Report drift without mutating: re-promoting an account the owner
        # deliberately demoted would make this command non-idempotent.
        missing = [
            flag for flag, expected in (
                ("role", User.Role.ADMIN),
                ("is_staff", True),
                ("is_superuser", True),
                ("email_verified", True),
            )
            if getattr(user, flag) != expected
        ]
        if missing:
            self.stderr.write(self.style.WARNING(
                f"  ...but {user.email} no longer has admin flags: {', '.join(missing)}. "
                f"Fix it at /admin/ — this command will not overwrite an existing row."
            ))
