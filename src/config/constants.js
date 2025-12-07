module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'edu_classrepo_secret_2024',
    JWT_EXPIRY: '24h',
    VALID_EMAIL_DOMAIN: '@eastdelta.edu.bd',
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
