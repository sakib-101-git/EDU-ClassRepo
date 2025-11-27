/*
 * ========================================
 * EDU CLASSREPO - SERVER
 * Express.js + PostgreSQL Backend
 * ========================================
 */

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'edu_classrepo_secret_2024';

/*
 * ========================================
 * MIDDLEWARE
 * ========================================
 */
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/*
 * ========================================
 * DATABASE CONNECTION
 * ========================================
 */
const pool = new Pool({
    host: '127.0.0.1',
    port: 5432,
    database: 'edu_classrepo',
    user: 'postgres',
    password: 'server123'
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log('Connected to PostgreSQL');
        release();
    }
});

/*
 * ========================================
 * FILE UPLOAD CONFIG
 * ========================================
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ 
    storage, 
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

/*
 * ========================================
 * AUTH MIDDLEWARE
 * ========================================
 */

// Verify JWT token
function auth(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
}

// Check if user is admin
function adminOnly(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

/*
 * ========================================
 * AUTH ROUTES
 * ========================================
 */

// Register new user
app.post('/api/auth/register', async (req, res) => {
    const { name, student_id, email, password, department, gender, semester } = req.body;
    
    // Validate email domain
    if (!email.endsWith('@eastdelta.edu.bd')) {
        return res.status(400).json({ error: 'Only @eastdelta.edu.bd emails allowed' });
    }
    
    try {
        const hash = await bcrypt.hash(password, 10);
        
        await pool.query(
            `INSERT INTO users (student_id, name, email, password, department, gender, semester) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [student_id, name, email.toLowerCase(), hash, department, gender, semester]
        );
        
        res.json({ message: 'Registration successful' });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password, userType } = req.body;
    
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1', 
            [email.toLowerCase()]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        const user = result.rows[0];
        
        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Wrong password' });
        }
        
        // Check admin access
        if (userType === 'admin' && user.role !== 'admin') {
            return res.status(403).json({ error: 'Not an admin account' });
        }
        
        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: user.student_id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/*
 * ========================================
 * COURSE ROUTES
 * ========================================
 */

// Get all courses
app.get('/api/courses', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM courses ORDER BY department, code'
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single course by ID
app.get('/api/courses/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM courses WHERE id = $1', 
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new course (Admin only)
app.post('/api/courses', auth, adminOnly, async (req, res) => {
    const { code, title, department, instructor } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO courses (code, title, department, instructor) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [code, title, department, instructor || 'TBA']
        );
        
        res.json({ id: result.rows[0].id, message: 'Course created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete course (Admin only)
app.delete('/api/courses/:id', auth, adminOnly, async (req, res) => {
    try {
        await pool.query('DELETE FROM courses WHERE id = $1', [req.params.id]);
        res.json({ message: 'Course deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/*
 * ========================================
 * ENROLLMENT ROUTES
 * ========================================
 */

// Get user's enrolled courses
app.get('/api/enrollments', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.* FROM courses c 
             JOIN enrollments e ON c.id = e.course_id 
             WHERE e.user_id = $1`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Enroll in a course
app.post('/api/enrollments', auth, async (req, res) => {
    const { courseId } = req.body;
    
    try {
        await pool.query(
            'INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2)',
            [req.user.id, courseId]
        );
        res.json({ message: 'Enrolled successfully' });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Already enrolled' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Unenroll from a course
app.delete('/api/enrollments/:courseId', auth, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM enrollments WHERE user_id = $1 AND course_id = $2',
            [req.user.id, req.params.courseId]
        );
        res.json({ message: 'Unenrolled successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/*
 * ========================================
 * FILE ROUTES
 * ========================================
 */

// Get approved files for a course
app.get('/api/files/:courseId', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT f.*, u.name as uploader_name 
             FROM files f 
             JOIN users u ON f.uploaded_by = u.id 
             WHERE f.course_id = $1 AND f.status = 'approved' 
             ORDER BY f.created_at DESC`,
            [req.params.courseId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get pending files (Admin only)
app.get('/api/files/pending/all', auth, adminOnly, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT f.*, u.name as uploader_name, c.code as course_code, c.title as course_title 
             FROM files f 
             JOIN users u ON f.uploaded_by = u.id 
             JOIN courses c ON f.course_id = c.id 
             WHERE f.status = 'pending' 
             ORDER BY f.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload a file
app.post('/api/files', auth, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Admin uploads are auto-approved
    const status = req.user.role === 'admin' ? 'approved' : 'pending';
    
    try {
        await pool.query(
            `INSERT INTO files (course_id, file_name, file_path, file_size, uploaded_by, status) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [req.body.courseId, req.file.originalname, req.file.filename, req.file.size, req.user.id, status]
        );
        
        const message = status === 'approved' 
            ? 'File uploaded successfully' 
            : 'File uploaded, pending admin approval';
            
        res.json({ message });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Approve a file (Admin only)
app.put('/api/files/:id/approve', auth, adminOnly, async (req, res) => {
    try {
        await pool.query(
            "UPDATE files SET status = 'approved' WHERE id = $1", 
            [req.params.id]
        );
        res.json({ message: 'File approved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rename a file (Admin only)
app.put('/api/files/:id/rename', auth, adminOnly, async (req, res) => {
    const { newName } = req.body;
    
    if (!newName || newName.trim() === '') {
        return res.status(400).json({ error: 'File name is required' });
    }
    
    try {
        await pool.query(
            'UPDATE files SET file_name = $1 WHERE id = $2',
            [newName.trim(), req.params.id]
        );
        res.json({ message: 'File renamed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reject/Delete a file (Admin only)
app.delete('/api/files/:id/reject', auth, adminOnly, async (req, res) => {
    try {
        await pool.query('DELETE FROM files WHERE id = $1', [req.params.id]);
        res.json({ message: 'File rejected' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete own file or admin delete any file
app.delete('/api/files/:id', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT uploaded_by FROM files WHERE id = $1', 
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        // Check permission
        if (result.rows[0].uploaded_by !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        await pool.query('DELETE FROM files WHERE id = $1', [req.params.id]);
        res.json({ message: 'File deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/*
 * ========================================
 * START SERVER
 * ========================================
 */
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
