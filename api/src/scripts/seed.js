/**
 * Database Seeding Script
 * Runs the seed.sql file to populate initial data
 * Usage: npm run seed
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

async function seed() {
  const client = await pool.connect();
  try {
    // eslint-disable-next-line no-console
    console.log('🌱 Starting database seeding...');

    const seedSql = fs.readFileSync(
      path.join(__dirname, 'seed.sql'),
      'utf-8',
    );

    // Split by semicolon and execute each statement
    const statements = seedSql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        await client.query(statement);
      } catch (err) {
        // Ignore "already exists" or "duplicate key" errors for idempotency
        if (
          !err.message.includes('already exists') &&
          !err.message.includes('duplicate key') &&
          !err.message.includes('does not exist')
        ) {
          throw err;
        }
        // eslint-disable-next-line no-console
        console.log(`ℹ  ${err.message.split('\n')[0]}`);
      }
    }

    // Verify seeding results
    const tenantCount = await client.query('SELECT COUNT(*) FROM tenants');
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const roleCount = await client.query('SELECT COUNT(*) FROM roles');
    const moduleCount = await client.query('SELECT COUNT(*) FROM modules');
    const permCount = await client.query('SELECT COUNT(*) FROM role_permissions');

    // eslint-disable-next-line no-console
    console.log('\n✅ Seeding completed successfully!');
    // eslint-disable-next-line no-console
    console.log('📊 Database Statistics:');
    // eslint-disable-next-line no-console
    console.log(`   - Tenants: ${tenantCount.rows[0].count}`);
    // eslint-disable-next-line no-console
    console.log(`   - Users: ${userCount.rows[0].count}`);
    // eslint-disable-next-line no-console
    console.log(`   - Roles: ${roleCount.rows[0].count}`);
    // eslint-disable-next-line no-console
    console.log(`   - Modules: ${moduleCount.rows[0].count}`);
    // eslint-disable-next-line no-console
    console.log(`   - Role Permissions: ${permCount.rows[0].count}`);
    // eslint-disable-next-line no-console
    console.log('\n🔐 Default Login Credentials:');
    // eslint-disable-next-line no-console
    console.log('   Email: admin@exitsaas.com');
    // eslint-disable-next-line no-console
    console.log('   Password: Admin@123');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    await pool.end();
  }
}

seed();
