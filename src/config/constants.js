/**
 * Application Constants
 * Configuration values for the application
 */

require('dotenv').config();

// Validate JWT_SECRET
if (!process.env.JWT_SECRET) {
    console.error('\n❌ ERROR: JWT_SECRET is not set!\n');
    console.error('To fix this:');
    console.error('1. Run: node generate-jwt-secret.js');
    console.error('2. Copy the generated secret');
    console.error('3. Create a .env file in the root directory');
    console.error('4. Add: JWT_SECRET=your_generated_secret_here\n');
    process.exit(1);
}

module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRY: '24h',
    VALID_EMAIL_DOMAIN: '@eastdelta.edu.bd',
    
    // Admin email addresses (hardcoded)
    ADMIN_EMAILS: [
        'nazmussakai@gmail.com',
        'misbahsaad01@gmail.com'
    ],
    
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