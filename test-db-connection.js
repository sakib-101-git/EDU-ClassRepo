/**
 * Database Connection Test Script
 * Use this to test your PostgreSQL connection before starting the server
 */

require('dotenv').config();
const { Pool } = require('pg');

console.log('Testing PostgreSQL connection...\n');

// Get connection details from environment or use defaults
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'edu_classrepo',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
};

console.log('Connection settings:');
console.log(`  Host: ${config.host}`);
console.log(`  Port: ${config.port}`);
console.log(`  Database: ${config.database}`);
console.log(`  User: ${config.user}`);
console.log(`  Password: ${config.password ? '***' : '(not set)'}\n`);

const pool = new Pool(config);

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Connection FAILED!');
        console.error(`Error: ${err.message}\n`);
        
        if (err.message.includes('password authentication failed')) {
            console.log('💡 SOLUTION:');
            console.log('1. Check your PostgreSQL password');
            console.log('2. Update the DB_PASSWORD in your .env file');
            console.log('3. Common passwords to try:');
            console.log('   - postgres (default)');
            console.log('   - (empty/blank)');
            console.log('   - Your Windows password');
            console.log('   - The password you set during PostgreSQL installation\n');
            console.log('To reset PostgreSQL password:');
            console.log('  Option 1: Use pgAdmin to change password');
            console.log('  Option 2: Edit pg_hba.conf to allow trust authentication temporarily');
            console.log('  Option 3: Use psql: ALTER USER postgres PASSWORD \'newpassword\';\n');
        } else if (err.message.includes('does not exist')) {
            console.log('💡 SOLUTION:');
            console.log('The database "edu_classrepo" does not exist.');
            console.log('Create it using: CREATE DATABASE edu_classrepo;');
        } else if (err.message.includes('ECONNREFUSED')) {
            console.log('💡 SOLUTION:');
            console.log('PostgreSQL server is not running or not accessible.');
            console.log('1. Make sure PostgreSQL service is running');
            console.log('2. Check if PostgreSQL is installed');
            console.log('3. Verify the host and port are correct');
        }
        
        process.exit(1);
    } else {
        console.log('✅ Connection SUCCESSFUL!');
        console.log(`Server time: ${res.rows[0].now}\n`);
        console.log('Your database connection is working correctly.');
        console.log('You can now start the server with: npm start\n');
        pool.end();
        process.exit(0);
    }
});

