const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    try {
        const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', '008-create-posts-table.sql');
        if (!fs.existsSync(migrationPath)) {
            console.error('Migration file not found:', migrationPath);
            process.exit(1);
        }
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration...');
        await pool.query(sql);
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        pool.end();
    }
}

runMigration();
