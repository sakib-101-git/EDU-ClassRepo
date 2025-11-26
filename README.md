# EDU ClassRepo
**East Delta University Note Sharing Platform**

## About
A web application where EDU students can download and share course notes.

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL |

## Project Structure
```
├── index.html          # Login & Registration
├── dashboard.html      # Browse courses
├── my-courses.html     # Enrolled courses
├── course.html         # Course files
├── admin.html          # Admin panel
├── settings.html       # Account settings
├── style.css           # All styles
├── app.js              # Frontend JavaScript
├── server.js           # Backend server
├── database.sql        # MySQL schema
├── package.json        # Dependencies
└── uploads/            # Uploaded files
```

## Features
- Student registration (only @eastdelta.edu.bd emails)
- Browse courses by department
- Upload notes (admin approval required)
- Download approved notes
- Profile picture upload
- Password change

## Setup

### Demo Mode (No Backend)
Just open `index.html` in browser - works with localStorage.

### With Backend
```bash
# 1. Create MySQL database and run database.sql
# 2. Install dependencies
npm install

# 3. Update database credentials in server.js
# 4. Start server
npm start
```

## Admin Accounts
| Email | Password |
|-------|----------|
| admin1@eastdelta.edu.bd | admin123 |
| admin2@eastdelta.edu.bd | admin123 |

## Team
- [Your Name] - [Student ID]
- [Member 2] - [Student ID]
