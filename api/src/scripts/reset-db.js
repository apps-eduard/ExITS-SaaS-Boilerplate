/**
 * Database Reset Script
 * Drops and recreates the database
 * Usage: node src/scripts/reset-db.js
 */

const { Pool } = require('pg');
require('dotenv').config();

async function resetDatabase() {
  const adminPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres',
  });

  try {
    console.log('📦 Resetting database...');
    const client = await adminPool.connect();

    try {
      // Terminate all connections to the database
      await client.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
         WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [process.env.DB_NAME]
      );

      // Drop database
      console.log(`🔄 Dropping database "${process.env.DB_NAME}"...`);
      await client.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
      console.log(`✅ Database "${process.env.DB_NAME}" dropped`);
    } finally {
      await client.release();
    }
  } catch (err) {
    console.error('❌ Reset failed:', err.message);
    process.exit(1);
  } finally {
    await adminPool.end();
  }
}

resetDatabase();
