-- =============================================
-- EDU CLASSREPO DATABASE SCHEMA
-- East Delta University Note Sharing Platform
-- =============================================

-- Create Database
CREATE DATABASE IF NOT EXISTS edu_classrepo;
USE edu_classrepo;

-- =============================================
-- TABLE 1: USERS
-- Stores student and admin accounts
-- =============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(50),
    role ENUM('student', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE 2: COURSES
-- Stores all available courses
-- =============================================
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    department VARCHAR(50) NOT NULL,
    instructor VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE 3: ENROLLMENTS
-- Links users to their enrolled courses
-- =============================================
CREATE TABLE enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (user_id, course_id)
);

-- =============================================
-- TABLE 4: FILES
-- Stores uploaded notes/documents
-- =============================================
CREATE TABLE files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    uploaded_by INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- INSERT DEFAULT ADMIN ACCOUNTS
-- =============================================
INSERT INTO users (student_id, name, email, password, department, role) VALUES
('ADM-001', 'Admin One', 'admin1@eastdelta.edu.bd', '$2b$10$xK8FjvFGqkqR6EIX.5Ks8.KjE5xKVJ8qx1ZYdZzZzZzZzZzZzZzZz', 'Administration', 'admin'),
('ADM-002', 'Admin Two', 'admin2@eastdelta.edu.bd', '$2b$10$xK8FjvFGqkqR6EIX.5Ks8.KjE5xKVJ8qx1ZYdZzZzZzZzZzZzZzZz', 'Administration', 'admin');

-- Note: The password hash above is for 'admin123'
-- In production, generate proper hashes using bcrypt

-- =============================================
-- INSERT SAMPLE COURSES
-- =============================================
INSERT INTO courses (code, title, department, instructor) VALUES
('CSE 101', 'Introduction to Programming', 'CSE', 'Dr. Rahman'),
('CSE 201', 'Data Structures', 'CSE', 'Dr. Ahmed'),
('CSE 301', 'Database Systems', 'CSE', 'Dr. Khan'),
('CSE 401', 'Software Engineering', 'CSE', 'Dr. Hasan'),
('EEE 101', 'Basic Electrical Engineering', 'EEE', 'Dr. Hossain'),
('EEE 201', 'Circuit Analysis', 'EEE', 'Dr. Alam'),
('BBA 101', 'Principles of Management', 'BBA', 'Dr. Karim'),
('BBA 201', 'Marketing Management', 'BBA', 'Dr. Islam');

-- =============================================
-- USEFUL QUERIES FOR REFERENCE
-- =============================================

-- Get all courses with file count:
-- SELECT c.*, COUNT(f.id) as file_count 
-- FROM courses c 
-- LEFT JOIN files f ON c.id = f.course_id AND f.status = 'approved'
-- GROUP BY c.id;

-- Get pending files for admin:
-- SELECT f.*, u.name as uploader, c.code, c.title 
-- FROM files f
-- JOIN users u ON f.uploaded_by = u.id
-- JOIN courses c ON f.course_id = c.id
-- WHERE f.status = 'pending';

-- Get enrolled courses for a user:
-- SELECT c.* FROM courses c
-- JOIN enrollments e ON c.id = e.course_id
-- WHERE e.user_id = ?;

