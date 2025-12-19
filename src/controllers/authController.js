const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('../config/database');
const { 
    JWT_SECRET, 
    JWT_EXPIRY, 
    VALID_EMAIL_DOMAIN, 
    EMAIL_USER, 
    EMAIL_PASS 
} = require('../config/constants');
const { validatePassword } = require('../utils/validation');

// Configure Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

exports.register = async (req, res, next) => {
    try {
        const { name, student_id, email, password, department, gender, semester } = req.body;
        
        if (!name || !student_id || !email || !password || !department) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // --- STUDENT EMAIL VALIDATION ---
        if (!email.endsWith(VALID_EMAIL_DOMAIN)) {
            return res.status(400).json({ error: `Only ${VALID_EMAIL_DOMAIN} emails allowed` });
        }
        
        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        const hash = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // Insert student as NOT VERIFIED (false)
        await pool.query(
            `INSERT INTO users (student_id, name, email, password, department, gender, semester, is_verified, verification_token) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [student_id, name, email.toLowerCase(), hash, department, gender || null, semester || null, false, verificationToken]
        );
        
        // Send Verification Email
        const verificationLink = `http://localhost:3000/api/auth/verify/${verificationToken}`;
        
        await transporter.sendMail({
            from: `"EDU ClassRepo" <${EMAIL_USER}>`,
            to: email,
            subject: 'Verify your EDU ClassRepo Account',
            html: `
                <h3>Welcome, ${name}!</h3>
                <p>Click the link below to verify your university email:</p>
                <a href="${verificationLink}">Verify Account</a>
            `
        });
        
        res.json({ message: 'Registration successful! Check your email to verify.' });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Email already registered' });
        next(err);
    }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        
        const result = await pool.query('SELECT * FROM users WHERE verification_token = $1', [token]);
        
        if (result.rows.length === 0) {
            return res.status(400).send('<h1>Invalid or expired link.</h1>');
        }
        
        const user = result.rows[0];
        
        // Verify user and remove token
        await pool.query(
            'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1',
            [user.id]
        );
        
        res.redirect('/index.html?verified=true');
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password, userType } = req.body;
        
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
        
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        
        if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });
        
        const user = result.rows[0];
        
        // --- BLOCK UNVERIFIED USERS ---
        if (!user.is_verified) {
            return res.status(403).json({ error: 'Please verify your email first.' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Wrong password' });
        
        if (userType === 'admin' && user.role !== 'admin') {
            return res.status(403).json({ error: 'Not an admin account' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: JWT_EXPIRY }
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
        next(err);
    }
};