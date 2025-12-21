/**
 * Authentication Controller
 * Handles user registration, login, and authentication
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { 
    JWT_SECRET, 
    VALID_EMAIL_DOMAIN,
    ADMIN_EMAILS 
} = require('../config/constants');
const { validatePassword } = require('../utils/validation');

/**
 * Register a new user (student or admin)
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
    try {
        const { name, student_id, email, password, department, gender, semester } = req.body;
        
        // Validate required fields
        if (!name || !student_id || !email || !password || !department) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const normalizedEmail = email.toLowerCase();
        
        // Check if email is admin email
        const isAdminEmail = ADMIN_EMAILS.includes(normalizedEmail);
        
        // Validate email domain (students must use @eastdelta.edu.bd)
        if (!isAdminEmail && !normalizedEmail.endsWith(VALID_EMAIL_DOMAIN)) {
            return res.status(400).json({ error: `Student emails must end with ${VALID_EMAIL_DOMAIN}` });
        }
        
        // Validate password length
        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Hash password
        const hash = await bcrypt.hash(password, 10);
        const role = isAdminEmail ? 'admin' : 'student';

        // Insert user into database
        const result = await pool.query(
            `INSERT INTO users (student_id, name, email, password, department, gender, semester, role) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [student_id, name, normalizedEmail, hash, department, gender || null, semester || null, role]
        );
        
        res.json({ 
            message: 'Account created successfully! You can login now.',
            email: normalizedEmail
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Email already registered' });
        }
        next(err);
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password, userType } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Verify password
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check admin role
        const isAdminEmail = ADMIN_EMAILS.includes(user.email);
        const finalRole = isAdminEmail ? 'admin' : user.role;

        // Verify user type matches (admin login requires admin role)
        if (userType === 'admin' && finalRole !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Not an Admin' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: finalRole }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: { 
                id: user.student_id, 
                name: user.name, 
                email: user.email, 
                role: finalRole,
                department: user.department 
            }
        });

    } catch (err) {
        next(err);
    }
};
