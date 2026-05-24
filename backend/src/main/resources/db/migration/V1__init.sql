-- EDU ClassRepo — Initial Schema
-- Flyway V1: creates all tables, indexes, and constraints from scratch.
-- Keep DDL in sync with entity classes; Hibernate ddl-auto=validate will catch drift.

-- ── Enable UUID extension (Supabase has this by default) ─────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── departments ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
    id   UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(20)  NOT NULL,
    name VARCHAR(100) NOT NULL,
    CONSTRAINT uq_departments_code UNIQUE (code)
);

-- ── faculty ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faculty (
    id            UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    short_form    VARCHAR(30)  NOT NULL,
    name          VARCHAR(150) NOT NULL,
    department_id UUID         REFERENCES departments(id) ON DELETE SET NULL,
    email         VARCHAR(150),
    CONSTRAINT uq_faculty_short_form UNIQUE (short_form)
);

CREATE INDEX IF NOT EXISTS idx_faculty_short_form    ON faculty (short_form);
CREATE INDEX IF NOT EXISTS idx_faculty_department_id ON faculty (department_id);

-- ── courses ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
    id            UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code          VARCHAR(30)  NOT NULL,
    title         VARCHAR(250) NOT NULL,
    department_id UUID         NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    credit_hours  INTEGER      NOT NULL DEFAULT 3,
    CONSTRAINT uq_courses_code UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_courses_code          ON courses (code);
CREATE INDEX IF NOT EXISTS idx_courses_department_id ON courses (department_id);

-- ── course_faculty (join table) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_faculty (
    course_id  UUID NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES faculty(id)  ON DELETE CASCADE,
    PRIMARY KEY (course_id, faculty_id)
);

-- ── users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id      VARCHAR(50),
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    password_hash   TEXT         NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'STUDENT',
    department_id   UUID         REFERENCES departments(id) ON DELETE SET NULL,
    gender          VARCHAR(10),
    semester_number INTEGER,
    profile_pic_url VARCHAR(500),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_email      UNIQUE (email),
    CONSTRAINT chk_users_role      CHECK (role IN ('STUDENT','FACULTY','ADMIN')),
    CONSTRAINT chk_users_gender    CHECK (gender IS NULL OR gender IN ('MALE','FEMALE','OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ── refresh_tokens ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(500) NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_refresh_tokens_token UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);

-- ── enrollments ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
    id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    course_id   UUID        NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_enrollments_user_course UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id   ON enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments (course_id);

-- ── materials ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS materials (
    id           UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id    UUID         NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id   UUID         REFERENCES faculty(id)          ON DELETE SET NULL,
    uploader_id  UUID         NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    file_name    VARCHAR(255) NOT NULL,
    file_url     VARCHAR(1000) NOT NULL,
    file_size    BIGINT       NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_materials_status CHECK (status IN ('PENDING','APPROVED','REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_materials_course_id  ON materials (course_id);
CREATE INDEX IF NOT EXISTS idx_materials_status     ON materials (status);

-- ── semesters ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS semesters (
    id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code       VARCHAR(30) NOT NULL,
    name       VARCHAR(100) NOT NULL,
    is_active  BOOLEAN     NOT NULL DEFAULT FALSE,
    start_date DATE,
    end_date   DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_semesters_code UNIQUE (code)
);

-- ── routine_slots ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routine_slots (
    id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    semester_id UUID        NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    course_id   UUID        NOT NULL REFERENCES courses(id)   ON DELETE CASCADE,
    faculty_id  UUID        REFERENCES faculty(id)            ON DELETE SET NULL,
    section     VARCHAR(10) NOT NULL,
    day_of_week VARCHAR(15) NOT NULL,
    start_time  TIME        NOT NULL,
    end_time    TIME        NOT NULL,
    room        VARCHAR(20),
    class_type  VARCHAR(10) NOT NULL DEFAULT 'THEORY',
    CONSTRAINT chk_slot_day   CHECK (day_of_week IN ('SATURDAY','SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY')),
    CONSTRAINT chk_slot_type  CHECK (class_type IN ('THEORY','LAB'))
);

CREATE INDEX IF NOT EXISTS idx_slot_semester  ON routine_slots (semester_id);
CREATE INDEX IF NOT EXISTS idx_slot_course    ON routine_slots (course_id);
CREATE INDEX IF NOT EXISTS idx_slot_faculty   ON routine_slots (faculty_id);

-- ── custom_routines ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_routines (
    id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id  UUID         NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    semester_id UUID         NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL DEFAULT 'My Routine',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_routine_student ON custom_routines (student_id);

-- ── custom_routine_slots (join table) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_routine_slots (
    routine_id UUID NOT NULL REFERENCES custom_routines(id) ON DELETE CASCADE,
    slot_id    UUID NOT NULL REFERENCES routine_slots(id)   ON DELETE CASCADE,
    PRIMARY KEY (routine_id, slot_id)
);

-- ── cover_page_templates ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cover_page_templates (
    id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type          VARCHAR(20) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    field_schema  JSONB,
    layout_config JSONB,
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_cpt_type CHECK (type IN ('ASSIGNMENT','LAB_REPORT','PROJECT','THESIS'))
);
