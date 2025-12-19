require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRY: '24h',
    VALID_EMAIL_DOMAIN: '@eastdelta.edu.bd',
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    
    // [CRITICAL] This line must be here
    MIN_PASSWORD_LENGTH: 6,

    FILE_STATUS: {
        PENDING: 'pending',
        APPROVED: 'approved',
        REJECTED: 'rejected'
    },
    USER_ROLE: {
        STUDENT: 'student',
        ADMIN: 'admin'
    }
};