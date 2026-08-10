"""One-shot import of the production catalog out of the OLD JAVA TABLES.

The Java/Spring backend is gone from the codebase, but its Flyway-created tables
are still sitting in the SAME Supabase database as the new Django tables, holding
the real production data:

    departments · faculty · courses · course_faculty · materials

This command copies those five into their Django counterparts, in FK order.

    python manage.py seed_data                      # MUST run first, see below
    python manage.py import_legacy_data --dry-run   # full real code path, rolled back
    python manage.py import_legacy_data             # commit
    python manage.py import_legacy_data --force     # allow non-empty target tables

WHY NOT db.sqlite3
------------------
backend/db.sqlite3 is the LOCAL DEV database. It holds a stale snapshot of the
deleted auto-seeding literals (144 courses / 59 faculty) — a SUBSET of production
(154 / 64), not a superset. An earlier command (`import_catalog.py`) read from it
by mistake; the numbers looked plausible, which is exactly why it slipped through.
The source here is the Java tables in Postgres, and nothing else.

WHY seed_data MUST RUN FIRST
----------------------------
`Material.uploader` is a NOT NULL FK to User. The original uploaders live in the
Java `users` table and are deliberately NOT imported (their passwords are Spring
BCrypt cost-12 hashes, unverifiable under Django's PASSWORD_HASHERS). So both
materials are re-pointed at the ADMIN_EMAIL_1 admin account — which only exists
once `seed_data` has created it. This command refuses to start if it is missing,
rather than dying on an FK violation halfway through.

READ-ONLY ON THE SOURCE
-----------------------
Every statement against a Java table is a SELECT. Nothing is written to them, so
they remain an intact fallback whether this succeeds or fails. The rollback path
is to DELETE from the Django tables only.

HAND-RUN ONLY
-------------
This is never wired into the Dockerfile CMD. Auto-seeding academic data on every
boot is precisely the bug that got `seed_data` rewritten (see CLAUDE.md issue #2);
re-introducing it here would silently revert edits made at /admin/ on each deploy.
"""

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

from apps.academics.models import Course, Department, Faculty
from apps.accounts.models import User
from apps.materials.models import Material

# Java (Flyway) table -> the Django table it feeds. Source names are interpolated
# into SQL below, so they are hardcoded constants here and never user input.
SOURCE_TABLES = ["departments", "faculty", "courses", "course_faculty", "materials"]
TARGET_MODELS = [Department, Faculty, Course, Material]


class _Rollback(Exception):
    """Raised at the end of a --dry-run to unwind the transaction."""


class Command(BaseCommand):
    help = "One-shot import of departments/faculty/courses/materials from the legacy Java tables."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Run the whole import for real inside a transaction, then roll it back.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Proceed even when the Django tables already hold rows (skips duplicates).",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        force = options["force"]

        # ASCII only in printed output: the Windows console codepage mangles em dashes.
        header = "DRY RUN - every write is rolled back" if dry_run else "LIVE RUN - writes commit"
        self.stdout.write(self.style.MIGRATE_HEADING(header))

        self._check_source_tables()
        admin = self._resolve_admin()
        self._check_target_empty(force)

        self.stdout.write(f"materials uploader -> {admin.email} (id={admin.id})")
        self.stdout.write("")

        stats = None
        try:
            with transaction.atomic():
                stats = self._import(admin)
                if dry_run:
                    raise _Rollback
        except _Rollback:
            pass

        self._report(stats, dry_run)

    # -- preflight ---------------------------------------------------------

    def _check_source_tables(self):
        """Fail early and clearly if the Java tables are already gone."""
        with connection.cursor() as cur:
            cur.execute(
                """SELECT table_name FROM information_schema.tables
                   WHERE table_schema = 'public' AND table_name = ANY(%s)""",
                [SOURCE_TABLES],
            )
            found = {row[0] for row in cur.fetchall()}

        missing = [t for t in SOURCE_TABLES if t not in found]
        if missing:
            raise CommandError(
                f"Legacy source table(s) not found in this database: {', '.join(missing)}. "
                f"Is DATABASE_URL pointing at the Supabase database that still has the "
                f"Java/Flyway tables?"
            )

    def _resolve_admin(self):
        """The User that both imported materials will be attributed to."""
        accounts = [a for a in settings.ADMIN_ACCOUNTS if a["slot"] == 1]
        if not accounts:
            raise CommandError(
                "ADMIN_EMAIL_1 / ADMIN_PASSWORD_1 are not configured, so there is no "
                "account to attribute the imported materials to."
            )

        email = accounts[0]["email"]
        admin = User.objects.filter(email=email).first()
        if admin is None:
            raise CommandError(
                f"Admin account {email} does not exist yet. Run "
                f"`python manage.py seed_data` FIRST - Material.uploader is a NOT NULL "
                f"FK and the original uploaders are not being imported."
            )
        return admin

    def _check_target_empty(self, force):
        """Refuse to double-import unless the owner insists."""
        populated = [
            (m._meta.db_table, m.objects.count())
            for m in TARGET_MODELS
            if m.objects.exists()
        ]
        link_count = Course.faculty.through.objects.count()
        if link_count:
            populated.append((Course.faculty.through._meta.db_table, link_count))

        if not populated:
            return

        detail = ", ".join(f"{table}={count}" for table, count in populated)
        if not force:
            raise CommandError(
                f"Target tables are not empty ({detail}). Refusing to run - a second "
                f"import risks duplicating live data. Pass --force to proceed anyway; "
                f"rows that already exist will be skipped, not duplicated."
            )

        self.stdout.write(self.style.WARNING(
            f"--force: target tables already hold rows ({detail}). "
            f"Existing rows will be SKIPPED, never overwritten."
        ))

    # -- the import --------------------------------------------------------

    def _import(self, admin):
        """FK order is mandatory: Course.department is PROTECT, materials come last."""
        stats = {k: self._counter() for k in
                 ("departments", "faculty", "courses", "links", "materials")}

        departments = self._import_departments(stats["departments"])
        faculty = self._import_faculty(stats["faculty"], departments)
        courses = self._import_courses(stats["courses"], departments)
        self._import_links(stats["links"], courses, faculty)
        self._import_materials(stats["materials"], courses, faculty, admin)

        return stats

    @staticmethod
    def _counter():
        return {"created": 0, "skipped": 0}

    @staticmethod
    def _rows(sql):
        """Read-only SELECT against a legacy table, returned as dicts."""
        with connection.cursor() as cur:
            cur.execute(sql)
            columns = [c[0] for c in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]

    def _import_departments(self, stats):
        """Returns {legacy id: Department} so children can resolve their FK."""
        mapping = {}

        for row in self._rows("SELECT id, code, name FROM departments ORDER BY code"):
            existing = Department.objects.filter(code=row["code"]).first() \
                or Department.objects.filter(pk=row["id"]).first()

            if existing is not None:
                mapping[row["id"]] = existing
                stats["skipped"] += 1
                continue

            obj = Department(id=row["id"], code=row["code"], name=row["name"])
            obj.save(force_insert=True)   # force_insert keeps the ORIGINAL uuid pk
            mapping[row["id"]] = obj
            stats["created"] += 1
            self.stdout.write(f"  + department  {row['code']:<6} {row['name']}")

        return mapping

    def _import_faculty(self, stats, departments):
        mapping = {}
        sql = ("SELECT id, short_form, name, email, department_id "
               "FROM faculty ORDER BY short_form")

        for row in self._rows(sql):
            department = departments.get(row["department_id"])
            if row["department_id"] and department is None:
                self.stdout.write(self.style.WARNING(
                    f"  ! faculty {row['short_form']} points at an unknown department "
                    f"- importing with department=None"
                ))

            existing = Faculty.objects.filter(short_form=row["short_form"]).first() \
                or Faculty.objects.filter(pk=row["id"]).first()

            if existing is not None:
                mapping[row["id"]] = existing
                stats["skipped"] += 1
                continue

            obj = Faculty(
                id=row["id"],
                short_form=row["short_form"],
                name=row["name"],
                email=row["email"],
                department=department,
            )
            obj.save(force_insert=True)
            mapping[row["id"]] = obj
            stats["created"] += 1
            self.stdout.write(f"  + faculty     {row['short_form']:<8} {row['name']}")

        return mapping

    def _import_courses(self, stats, departments):
        mapping = {}
        sql = ("SELECT id, code, title, credit_hours, department_id "
               "FROM courses ORDER BY code")

        for row in self._rows(sql):
            department = departments.get(row["department_id"])
            if department is None:
                # Course.department is PROTECT and NOT NULL — there is no safe
                # fallback, so abort the whole transaction rather than guess.
                raise CommandError(
                    f"Course {row['code']} references department id "
                    f"{row['department_id']} which was not imported. Aborting; "
                    f"nothing is written."
                )

            existing = Course.objects.filter(code=row["code"]).first() \
                or Course.objects.filter(pk=row["id"]).first()

            if existing is not None:
                mapping[row["id"]] = existing
                stats["skipped"] += 1
                continue

            obj = Course(
                id=row["id"],
                code=row["code"],
                title=row["title"],
                credit_hours=row["credit_hours"],
                department=department,
            )
            obj.save(force_insert=True)
            mapping[row["id"]] = obj
            stats["created"] += 1
            self.stdout.write(
                f"  + course      {row['code']:<9} {row['credit_hours']:>3} cr  {row['title']}"
            )

        return mapping

    def _import_links(self, stats, courses, faculty):
        """The Course.faculty M2M. Additive only — never unlinks anything.

        Note: in production this table is EMPTY (0 rows). A "links created 0"
        line is the correct result, not a failure.
        """
        for row in self._rows("SELECT course_id, faculty_id FROM course_faculty"):
            course = courses.get(row["course_id"])
            teacher = faculty.get(row["faculty_id"])

            if course is None or teacher is None:
                stats["skipped"] += 1
                self.stdout.write(self.style.WARNING(
                    "  ! link skipped - course or faculty was not imported"
                ))
                continue

            if course.faculty.filter(pk=teacher.pk).exists():
                stats["skipped"] += 1
                continue

            course.faculty.add(teacher)
            stats["created"] += 1
            self.stdout.write(f"  + link        {course.code} <- {teacher.short_form}")

    def _import_materials(self, stats, courses, faculty, admin):
        """Last, because it needs both the courses above and seed_data's admin."""
        sql = ("SELECT id, course_id, faculty_id, file_name, file_url, file_size, "
               "content_type, status, created_at FROM materials ORDER BY created_at")
        rows = self._rows(sql)
        restored = []

        for row in rows:
            course = courses.get(row["course_id"])
            if course is None:
                raise CommandError(
                    f"Material {row['file_name']} references course id "
                    f"{row['course_id']} which was not imported. Aborting."
                )

            teacher = faculty.get(row["faculty_id"]) if row["faculty_id"] else None
            if row["faculty_id"] and teacher is None:
                self.stdout.write(self.style.WARNING(
                    f"  ! material {row['file_name']} points at an unknown faculty "
                    f"- importing with faculty=None"
                ))

            if Material.objects.filter(pk=row["id"]).exists():
                stats["skipped"] += 1
                continue

            obj = Material(
                id=row["id"],
                course=course,
                faculty=teacher,
                uploader=admin,             # original uploader is NOT imported
                file_name=row["file_name"],
                file_url=row["file_url"],   # R2 URL preserved verbatim
                file_size=row["file_size"],
                content_type=row["content_type"],
                status=row["status"],
            )
            obj.save(force_insert=True)
            restored.append(row["id"])
            stats["created"] += 1
            self.stdout.write(
                f"  + material    {row['file_name']}  [{row['status']}]  -> {course.code}"
            )
            self.stdout.write(f"                url  {row['file_url']}")
            self.stdout.write(f"                orig created_at {row['created_at']}")

        self._restore_created_at(restored)

    def _restore_created_at(self, ids):
        """created_at is auto_now_add, so the INSERT above stamped it 'now'.

        Put the real historical timestamps back with an UPDATE joining the legacy
        table on id. Scoped to the ids just inserted, so a --force run cannot
        rewrite the timestamp of a row that was already there.
        """
        if not ids:
            return

        with connection.cursor() as cur:
            cur.execute(
                """UPDATE materials_material AS tgt
                      SET created_at = src.created_at
                     FROM materials AS src
                    WHERE src.id = tgt.id
                      AND tgt.id = ANY(%s)""",
                [ids],
            )
            self.stdout.write(
                f"  ~ restored original created_at on {cur.rowcount} material(s)"
            )

    # -- output ------------------------------------------------------------

    def _report(self, stats, dry_run):
        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("summary"))
        for label, counts in stats.items():
            self.stdout.write(
                f"  {label:<12} created {counts['created']:>4}    skipped {counts['skipped']:>4}"
            )

        # NB: this runs AFTER the transaction closed, so on a --dry-run these are
        # post-rollback reads -- all zeros is the proof that nothing stuck.
        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING(
            "target tables NOW (after rollback)" if dry_run else "target tables after commit"
        ))
        for model in TARGET_MODELS:
            self.stdout.write(f"  {model._meta.db_table:<26} {model.objects.count():>4}")
        through = Course.faculty.through
        self.stdout.write(f"  {through._meta.db_table:<26} {through.objects.count():>4}")

        self.stdout.write("")
        if dry_run:
            self.stdout.write(self.style.WARNING(
                "Rolled back. The zeros above were read AFTER the rollback - that is the "
                "proof nothing was written. Re-run without --dry-run to apply."
            ))
        else:
            self.stdout.write(self.style.SUCCESS("Import committed."))
            self.stdout.write(
                "The legacy Java tables were read-only throughout and are unchanged - "
                "they remain a full fallback."
            )
