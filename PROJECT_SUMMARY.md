# EDU ClassRepo - Project Summary

## Project Overview
A note-sharing platform for East Delta University students to upload, download, and manage course materials (PDF files).

## Technology Stack

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with responsive design
- **JavaScript (Vanilla)** - Client-side logic
- **Font Awesome** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Multer** - File upload handling
- **bcrypt** - Password hashing

## Features Implemented

### 1. User Authentication
- Student registration with university email validation
- Admin and Student login
- JWT token-based authentication
- Password hashing with bcrypt

### 2. Course Management (CRUD)
- **Create**: Admin can create courses
- **Read**: All users can view available courses
- **Update**: Admin can update course details
- **Delete**: Admin can delete courses

### 3. Enrollment System
- Students can enroll in courses
- View enrolled courses
- Unenroll from courses

### 4. File Management (CRUD)
- **Create**: Students upload files (pending admin approval)
- **Read**: View and download approved files
- **Update**: Admin can rename files
- **Delete**: Admin can delete/reject files

### 5. Admin Panel
- View pending file uploads
- Approve or reject files
- Rename files
- Manage courses

## Project Structure

```
EDU-ClassRepo/
├── public/              # Frontend files
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript
│   ├── index.html      # Login/Signup page
│   ├── dashboard.html  # Course listing
│   ├── my-courses.html # Enrolled courses
│   ├── course.html     # Course files
│   ├── admin.html      # Admin panel
│   └── settings.html   # User settings
├── src/                # Backend
│   ├── config/         # Database, constants, multer
│   ├── controllers/    # Business logic
│   ├── middleware/     # Auth, error handling
│   ├── routes/         # API routes
│   └── utils/          # Validation helpers
├── uploads/            # Uploaded files
├── server.js           # Main server
└── database.sql        # Database schema
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (Admin)
- `PUT /api/courses/:id` - Update course (Admin)
- `DELETE /api/courses/:id` - Delete course (Admin)

### Enrollments
- `GET /api/enrollments` - Get user enrollments
- `POST /api/enrollments` - Enroll in course
- `DELETE /api/enrollments/:courseId` - Unenroll

### Files
- `GET /api/files/:courseId` - Get course files
- `GET /api/files/pending/all` - Get pending files (Admin)
- `POST /api/files` - Upload file
- `PUT /api/files/:id/approve` - Approve file (Admin)
- `PUT /api/files/:id/rename` - Rename file (Admin)
- `DELETE /api/files/:id` - Delete file
- `DELETE /api/files/:id/reject` - Reject file (Admin)

## Database Schema

### Users
- id, student_id, name, email, password, department, gender, semester, role, created_at

### Courses
- id, code, title, department, instructor, created_at

### Enrollments
- id, user_id, course_id, enrolled_at

### Files
- id, course_id, file_name, file_path, file_size, uploaded_by, status, created_at

## How to Run

1. Install dependencies: `npm install`
2. Setup database: Run `database.sql` in PostgreSQL
3. Create `.env` file with database credentials
4. Start server: `npm start`
5. Access: `http://localhost:3000`

## Admin Account
- Email: `nazmussakai@gmail.com`
- Create admin: `node create_admins.js`

