/* =============================================
   EDU CLASSREPO - BACKEND SERVER
   Node.js + Express + MySQL
   ============================================= */

const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'edu_classrepo_secret_key_2024'; // Change in production

/* =============================================
   MIDDLEWARE SETUP
   ============================================= */
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve frontend files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =============================================
   DATABASE CONNECTION
   Update these credentials for your MySQL setup
   ============================================= */
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',  // Your MySQL password
    database: 'edu_classrepo'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        console.log('Running in demo mode without database...');
    } else {
        console.log('Connected to MySQL database');
    }
});

/* =============================================
   FILE UPLOAD CONFIGURATION
   ============================================= */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/* =============================================
   AUTHENTICATION MIDDLEWARE
   ============================================= */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Admin only middleware
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
}


/* =============================================
   AUTH ROUTES
   ============================================= */

// POST /api/auth/register - Register new student
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, studentId, email, password, department } = req.body;
        
        // Validate email domain
        if (!email.toLowerCase().endsWith('@eastdelta.edu.bd')) {
            return res.status(400).json({ 
                success: false, 
                message: 'Only @eastdelta.edu.bd emails are allowed' 
            });
        }
        
        // Check if email exists
        const [existing] = await db.promise().query(
            'SELECT id FROM users WHERE email = ?', 
            [email.toLowerCase()]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already registered' 
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user
        await db.promise().query(
            'INSERT INTO users (student_id, name, email, password, department, role) VALUES (?, ?, ?, ?, ?, ?)',
            [studentId, name, email.toLowerCase(), hashedPassword, department, 'student']
        );
        
        res.json({ success: true, message: 'Registration successful' });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/auth/login - Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, userType } = req.body;
        
        // Find user
        const [users] = await db.promise().query(
            'SELECT * FROM users WHERE email = ?', 
            [email.toLowerCase()]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'No account found with this email' 
            });
        }
        
        const user = users[0];
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Incorrect password' 
            });
        }
        
        // Check role matches
        if (userType === 'admin' && user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'This account does not have admin access' 
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            token: token,
            user: {
                id: user.student_id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


/* =============================================
   COURSE ROUTES (CRUD)
   ============================================= */

// GET /api/courses - Get all courses
app.get('/api/courses', async (req, res) => {
    try {
        const [courses] = await db.promise().query(
            'SELECT * FROM courses ORDER BY department, code'
        );
        res.json({ success: true, courses: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/courses/:id - Get single course
app.get('/api/courses/:id', async (req, res) => {
    try {
        const [courses] = await db.promise().query(
            'SELECT * FROM courses WHERE id = ?',
            [req.params.id]
        );
        
        if (courses.length === 0) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        
        res.json({ success: true, course: courses[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/courses - Create course (Admin only)
app.post('/api/courses', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { code, title, department, instructor } = req.body;
        
        const [result] = await db.promise().query(
            'INSERT INTO courses (code, title, department, instructor) VALUES (?, ?, ?, ?)',
            [code, title, department, instructor]
        );
        
        res.json({ 
            success: true, 
            message: 'Course created',
            courseId: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/courses/:id - Update course (Admin only)
app.put('/api/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { code, title, department, instructor } = req.body;
        
        await db.promise().query(
            'UPDATE courses SET code = ?, title = ?, department = ?, instructor = ? WHERE id = ?',
            [code, title, department, instructor, req.params.id]
        );
        
        res.json({ success: true, message: 'Course updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/courses/:id - Delete course (Admin only)
app.delete('/api/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await db.promise().query('DELETE FROM courses WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Course deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


/* =============================================
   FILE ROUTES (CRUD)
   ============================================= */

// GET /api/files/course/:courseId - Get files for a course
app.get('/api/files/course/:courseId', async (req, res) => {
    try {
        const [files] = await db.promise().query(
            `SELECT f.*, u.name as uploader_name 
             FROM files f 
             JOIN users u ON f.uploaded_by = u.id 
             WHERE f.course_id = ? AND f.status = 'approved'
             ORDER BY f.upload_date DESC`,
            [req.params.courseId]
        );
        res.json({ success: true, files: files });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/files/pending - Get pending files (Admin only)
app.get('/api/files/pending', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [files] = await db.promise().query(
            `SELECT f.*, u.name as uploader_name, c.code as course_code, c.title as course_title
             FROM files f 
             JOIN users u ON f.uploaded_by = u.id 
             JOIN courses c ON f.course_id = c.id
             WHERE f.status = 'pending'
             ORDER BY f.upload_date DESC`
        );
        res.json({ success: true, files: files });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/files/upload - Upload a file
app.post('/api/files/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { courseId } = req.body;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        const status = req.user.role === 'admin' ? 'approved' : 'pending';
        
        await db.promise().query(
            'INSERT INTO files (course_id, file_name, file_path, file_size, uploaded_by, status) VALUES (?, ?, ?, ?, ?, ?)',
            [courseId, file.originalname, file.filename, file.size, req.user.id, status]
        );
        
        res.json({ 
            success: true, 
            message: status === 'approved' ? 'File uploaded' : 'File uploaded, pending approval'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/files/:id/approve - Approve file (Admin only)
app.put('/api/files/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await db.promise().query(
            'UPDATE files SET status = ? WHERE id = ?',
            ['approved', req.params.id]
        );
        res.json({ success: true, message: 'File approved' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/files/:id - Delete file
app.delete('/api/files/:id', authenticateToken, async (req, res) => {
    try {
        // Check if user owns the file or is admin
        const [files] = await db.promise().query(
            'SELECT uploaded_by FROM files WHERE id = ?',
            [req.params.id]
        );
        
        if (files.length === 0) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }
        
        if (files[0].uploaded_by !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        await db.promise().query('DELETE FROM files WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'File deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


/* =============================================
   ENROLLMENT ROUTES
   ============================================= */

// GET /api/enrollments - Get user's enrolled courses
app.get('/api/enrollments', authenticateToken, async (req, res) => {
    try {
        const [courses] = await db.promise().query(
            `SELECT c.* FROM courses c
             JOIN enrollments e ON c.id = e.course_id
             WHERE e.user_id = ?`,
            [req.user.id]
        );
        res.json({ success: true, courses: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/enrollments - Enroll in a course
app.post('/api/enrollments', authenticateToken, async (req, res) => {
    try {
        const { courseId } = req.body;
        
        await db.promise().query(
            'INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)',
            [req.user.id, courseId]
        );
        
        res.json({ success: true, message: 'Enrolled successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Already enrolled' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/enrollments/:courseId - Unenroll from a course
app.delete('/api/enrollments/:courseId', authenticateToken, async (req, res) => {
    try {
        await db.promise().query(
            'DELETE FROM enrollments WHERE user_id = ? AND course_id = ?',
            [req.user.id, req.params.courseId]
        );
        res.json({ success: true, message: 'Unenrolled successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


/* =============================================
   START SERVER
   ============================================= */
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║   EDU ClassRepo Server Running         ║
    ║   http://localhost:${PORT}               ║
    ╚════════════════════════════════════════╝
    `);
});

