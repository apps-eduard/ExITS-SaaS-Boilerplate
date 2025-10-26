require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'exitssaas',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function dropTable() {
  try {
    console.log('Dropping payment_method_types table (if exists)...');
    await pool.query('DROP TABLE IF EXISTS payment_method_types CASCADE');
    console.log('✅ Table dropped successfully');
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
  }
}

dropTable();
