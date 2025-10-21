/**
 * Database Setup Script
 * Creates the database and runs migrations
 * Usage: node src/scripts/setup-db.js
 */

const { Pool, Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  // First, connect to the default postgres database to create our database
  const adminPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    console.log('📦 Setting up database...');
    const client = await adminPool.connect();

    // Create database if it doesn't exist
    try {
      console.log(`🔄 Creating database "${process.env.DB_NAME}"...`);
      await client.query(`CREATE DATABASE ${process.env.DB_NAME};`);
      console.log(`✅ Database "${process.env.DB_NAME}" created successfully!`);
    } catch (err) {
      if (err.code === '42P04') {
        // Database already exists
        console.log(`ℹ️  Database "${process.env.DB_NAME}" already exists`);
      } else {
        throw err;
      }
    }

    await client.release();

    // Now connect to the newly created database and run migrations
    console.log('\n🔄 Running migrations...');
    const appPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
    });

    const migrationClient = await appPool.connect();
    try {
      const schemaSql = fs.readFileSync(
        path.join(__dirname, 'schema.sql'),
        'utf-8'
      );

      const statements = schemaSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        try {
          await migrationClient.query(statement);
        } catch (err) {
          if (!err.message.includes('already exists')) {
            throw err;
          }
          console.log(`ℹ️  ${err.message.split('\n')[0]}`);
        }
      }

      console.log('✅ Database migrations completed successfully!');

      // Run seed if requested
      const seedPath = path.join(__dirname, 'seed.js');
      if (fs.existsSync(seedPath)) {
        console.log('\n🌱 Running seed script...');
        require('./seed');
      }
    } finally {
      await migrationClient.release();
      await appPool.end();
    }
  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
    process.exit(1);
  } finally {
    await adminPool.end();
  }
}

setupDatabase();
