-- Change credit_hours from INTEGER to DOUBLE PRECISION to support 1.5-credit courses
ALTER TABLE courses
    ALTER COLUMN credit_hours TYPE DOUBLE PRECISION
    USING credit_hours::DOUBLE PRECISION;
ALTER TABLE courses ALTER COLUMN credit_hours SET DEFAULT 3;
