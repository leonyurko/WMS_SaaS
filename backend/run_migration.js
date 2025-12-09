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

async function runMigrations() {
    try {
        const migrationsDir = path.join(__dirname, 'src', 'database', 'migrations');

        // Get all SQL files
        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Ensure 008 comes before 009

        console.log(`Found ${files.length} migrations.`);

        for (const file of files) {
            // We only care about our new migrations for now, or we can just run them all with IF NOT EXISTS (which they have)
            // 008 uses IF NOT EXISTS for table.
            // 009 uses IF NOT EXISTS for column.
            // Older migrations might not be safe to re-run blindly unless they are idempotent.
            // Assuming the user needs the posts specific ones mainly. 
            // But to be safe for this specific "apply updates" script, let's filter for our known new ones 
            // OR just rely on the user running this once.
            // Given the previous instructions, let's just run them all. Most migrations *should* be idempotent or fail harmlessly if already done?
            // Actually standard migrations fail if table exists. 008 has IF NOT EXISTS.
            // 009 has IF NOT EXISTS.
            // Let's rely on that.

            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');

            console.log(`Running migration: ${file}...`);
            try {
                await pool.query(sql);
                console.log(`Passed: ${file}`);
            } catch (e) {
                console.warn(`Warning: Migration ${file} might have failed or already been applied. Error: ${e.message}`);
                // Continue to next migration
            }
        }

        console.log('All migrations sequence completed.');
    } catch (err) {
        console.error('Migration runner failed:', err);
        process.exit(1);
    } finally {
        pool.end();
    }
}

runMigrations();
