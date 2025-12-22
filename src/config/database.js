/**
 * Database Configuration
 * PostgreSQL connection pool setup
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'edu_classrepo',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
});

pool.on('error', (err) => {
    console.error('❌ Database connection error:', err.message);
    if (err.message.includes('password authentication failed')) {
        console.error('\n💡 SOLUTION:');
        console.error('1. Check your PostgreSQL password in the .env file');
        console.error('2. Common passwords to try: postgres, (empty), or your Windows password');
        console.error('3. To reset password: ALTER USER postgres PASSWORD \'newpassword\';');
        console.error('4. Run: node test-db-connection.js to test your connection\n');
    }
});

// Test connection on startup
pool.query('SELECT NOW()', (err) => {
    if (err) {
        console.error('❌ Failed to connect to database:', err.message);
        if (err.message.includes('password authentication failed')) {
            console.error('\n⚠️  Please update DB_PASSWORD in your .env file with the correct PostgreSQL password');
        }
    } else {
        console.log('✅ Connected to PostgreSQL database');
    }
});

module.exports = pool;
