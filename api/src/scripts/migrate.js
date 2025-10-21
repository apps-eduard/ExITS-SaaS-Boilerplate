/**
 * Database Migration Script
 * Runs the schema.sql file to initialize the database
 * Usage: node src/scripts/migrate.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting database migration...');
    const schemaSql = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf-8'
    );

    // Split by semicolon and execute each statement
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      try {
        await client.query(statement);
      } catch (err) {
        // Ignore "already exists" errors for idempotency
        if (!err.message.includes('already exists')) {
          throw err;
        }
        console.log(`ℹ  ${err.message.split('\n')[0]}`);
      }
    }

    console.log('✅ Database migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    await pool.end();
  }
}

migrate();
