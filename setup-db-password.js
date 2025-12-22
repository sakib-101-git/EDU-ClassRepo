/**
 * Database Password Setup Helper
 * Helps you find and set the correct PostgreSQL password
 */

require('dotenv').config();
const readline = require('readline');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔐 PostgreSQL Password Setup Helper\n');
console.log('This script will help you test and set the correct database password.\n');

function testConnection(password) {
    return new Promise((resolve) => {
        const pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'edu_classrepo',
            user: process.env.DB_USER || 'postgres',
            password: password
        });

        pool.query('SELECT NOW()', (err) => {
            pool.end();
            resolve(!err);
        });
    });
}

async function updateEnvFile(password) {
    const envPath = path.join(__dirname, '.env');
    let content = fs.readFileSync(envPath, 'utf8');
    
    // Update DB_PASSWORD line
    content = content.replace(
        /^DB_PASSWORD=.*$/m,
        `DB_PASSWORD=${password}`
    );
    
    fs.writeFileSync(envPath, content, 'utf8');
    console.log('\n✅ Updated .env file with the correct password!');
}

async function main() {
    console.log('Common PostgreSQL passwords to try:');
    console.log('1. postgres (default)');
    console.log('2. (empty/blank)');
    console.log('3. Your Windows user password');
    console.log('4. Custom password\n');

    rl.question('Enter PostgreSQL password (or press Enter to try "postgres"): ', async (input) => {
        const password = input.trim() || 'postgres';
        
        console.log('\nTesting connection...');
        const success = await testConnection(password);
        
        if (success) {
            console.log('✅ Connection successful!');
            await updateEnvFile(password);
            console.log('\n🎉 Database is now configured correctly!');
            console.log('You can now start the server with: npm start\n');
        } else {
            console.log('❌ Connection failed with that password.');
            console.log('\n💡 Options:');
            console.log('1. Try a different password');
            console.log('2. Reset PostgreSQL password using pgAdmin');
            console.log('3. Run: ALTER USER postgres PASSWORD \'newpassword\'; in psql');
            console.log('4. Check if PostgreSQL service is running\n');
        }
        
        rl.close();
    });
}

main();


