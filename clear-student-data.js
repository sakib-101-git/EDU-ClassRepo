/**
 * Clear All Student Data Script
 * Removes all student accounts, enrollments, and uploaded files
 * WARNING: This will delete all student data permanently!
 */

require('dotenv').config();
const { Pool } = require('pg');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'edu_classrepo',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
});

async function clearStudentData() {
    try {
        console.log('🗑️  Clearing all student data...\n');

        // Get count of students before deletion
        const studentCount = await pool.query(
            "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
        );
        const count = parseInt(studentCount.rows[0].count);
        
        if (count === 0) {
            console.log('✅ No student data found. Database is already clean.\n');
            await pool.end();
            return;
        }

        console.log(`Found ${count} student account(s) to delete.\n`);

        // Delete files uploaded by students (cascade will handle this, but let's be explicit)
        const filesResult = await pool.query(
            `DELETE FROM files WHERE uploaded_by IN (SELECT id FROM users WHERE role = 'student')`
        );
        console.log(`✅ Deleted ${filesResult.rowCount} file(s) uploaded by students`);

        // Delete enrollments (cascade will handle this, but let's be explicit)
        const enrollmentsResult = await pool.query(
            `DELETE FROM enrollments WHERE user_id IN (SELECT id FROM users WHERE role = 'student')`
        );
        console.log(`✅ Deleted ${enrollmentsResult.rowCount} enrollment(s)`);

        // Delete all student users
        const usersResult = await pool.query(
            "DELETE FROM users WHERE role = 'student'"
        );
        console.log(`✅ Deleted ${usersResult.rowCount} student account(s)\n`);

        // Clean up orphaned files in uploads directory
        const uploadsDir = path.join(__dirname, 'uploads');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            let deletedCount = 0;
            
            // Get list of valid file paths from database
            const validFiles = await pool.query('SELECT file_path FROM files');
            const validPaths = new Set(validFiles.rows.map(row => row.file_path));
            
            for (const file of files) {
                if (!validPaths.has(file)) {
                    try {
                        fs.unlinkSync(path.join(uploadsDir, file));
                        deletedCount++;
                    } catch (err) {
                        // File might be in use, skip
                    }
                }
            }
            
            if (deletedCount > 0) {
                console.log(`✅ Cleaned up ${deletedCount} orphaned file(s) from uploads directory\n`);
            }
        }

        console.log('🎉 All student data has been cleared successfully!');
        console.log('The database is now fresh and ready for new student registrations.\n');

    } catch (err) {
        console.error('❌ Error clearing student data:', err.message);
        if (err.message.includes('password authentication failed')) {
            console.error('\n💡 Please update DB_PASSWORD in your .env file');
        }
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will permanently delete:');
console.log('   - All student accounts');
console.log('   - All student enrollments');
console.log('   - All files uploaded by students');
console.log('   - Orphaned files in uploads directory\n');
console.log('Admin accounts and courses will NOT be affected.\n');

rl.question('Are you sure you want to continue? (yes/no): ', async (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        await clearStudentData();
    } else {
        console.log('\n❌ Operation cancelled. No data was deleted.\n');
    }
    rl.close();
});


