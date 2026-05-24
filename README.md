# EDU ClassRepo - Note Sharing Platform

A web application for East Delta University students to share and download course notes and study materials.

## Features

- **User Authentication**: Student and Admin login system
- **Course Management**: Browse, enroll, and manage courses
- **File Sharing**: Upload and download PDF files for courses
- **Admin Panel**: Approve/reject uploaded files
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)
- Font Awesome Icons

### Backend
- Node.js
- Express.js
- PostgreSQL Database
- JWT Authentication
- Multer (File Upload)

## Project Structure

```
EDU-ClassRepo/
├── public/              # Frontend files
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   └── *.html          # HTML pages
├── src/                # Backend source code
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   └── utils/          # Utility functions
├── uploads/            # Uploaded files directory
├── server.js           # Main server file
└── package.json        # Dependencies
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE edu_classrepo;
```

2. Run database schema:
```bash
psql -U postgres -d edu_classrepo -f database.sql
```

3. Create admin users (optional):
```bash
node create_admins.js
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edu_classrepo
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_here
```

### 4. Run the Server

```bash
npm start
```

### 5. Access the Application

Open browser and navigate to: `http://localhost:3000`

## Default Admin Account

- Email: `nazmussakai@gmail.com`
- Password: Set via `create_admins.js` script (default: `admin123`)

## CRUD Operations

### Courses
- **Create**: Admin can create new courses
- **Read**: All users can view available courses
- **Update**: Admin can update course details
- **Delete**: Admin can delete courses

### Files
- **Create**: Students can upload files (pending approval)
- **Read**: Users can view and download approved files
- **Update**: Admin can rename files
- **Delete**: Admin can delete/reject files

### Enrollments
- **Create**: Students can enroll in courses
- **Read**: Students can view their enrolled courses
- **Delete**: Students can unenroll from courses

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
- `GET /api/enrollments` - Get user's enrollments
- `POST /api/enrollments` - Enroll in course
- `DELETE /api/enrollments/:courseId` - Unenroll from course

### Files
- `GET /api/files/:courseId` - Get course files
- `GET /api/files/pending/all` - Get pending files (Admin)
- `POST /api/files` - Upload file
- `PUT /api/files/:id/approve` - Approve file (Admin)
- `PUT /api/files/:id/rename` - Rename file (Admin)
- `DELETE /api/files/:id` - Delete file
- `DELETE /api/files/:id/reject` - Reject file (Admin)

## Database Schema

### Users Table
- id, student_id, name, email, password, department, gender, semester, role, created_at

### Courses Table
- id, code, title, department, instructor, created_at

### Enrollments Table
- id, user_id, course_id, enrolled_at

### Files Table
- id, course_id, file_name, file_path, file_size, uploaded_by, status, created_at

## License

ISC License
