-- Drop routine/semester tables removed in the codebase cleanup
-- Order matters: child tables before parents due to FK constraints
DROP TABLE IF EXISTS custom_routine_slots;
DROP TABLE IF EXISTS custom_routines;
DROP TABLE IF EXISTS routine_slots;
DROP TABLE IF EXISTS semesters;
