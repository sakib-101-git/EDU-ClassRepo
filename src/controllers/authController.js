const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { JWT_SECRET, JWT_EXPIRY, VALID_EMAIL_DOMAIN } = require('../config/constants');
const { validateEmail, validatePassword } = require('../utils/validation');

exports.register = async (req, res, next) => {
    try {
        const { name, student_id, email, password, department, gender, semester } = req.body;
        
        if (!name || !student_id || !email || !password || !department) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (!validateEmail(email)) {
            return res.status(400).json({ error: `Only ${VALID_EMAIL_DOMAIN} emails allowed` });
        }
        
        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        const hash = await bcrypt.hash(password, 10);
        
        await pool.query(
            `INSERT INTO users (student_id, name, email, password, department, gender, semester) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [student_id, name, email.toLowerCase(), hash, department, gender || null, semester || null]
        );
        
        res.json({ message: 'Registration successful' });
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password, userType } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1', 
            [email.toLowerCase()]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        const user = result.rows[0];
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Wrong password' });
        }
        
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
