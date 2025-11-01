require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'exitssaas',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function createPaymentMethodTypesTable() {
  const client = await pool.connect();
  
  try {
    console.log('Creating payment_method_types table...');
    
    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_method_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    console.log('✅ Table created successfully');
    
    // Insert default payment method types
    await client.query(`
      INSERT INTO payment_method_types (name, display_name, description) VALUES
        ('stripe', 'Stripe', 'Credit/Debit Card via Stripe'),
        ('paypal', 'PayPal', 'PayPal Account'),
        ('gcash', 'GCash', 'GCash Mobile Wallet'),
        ('bank_transfer', 'Bank Transfer', 'Direct Bank Transfer'),
        ('manual', 'Manual Payment', 'Offline/Manual Payment Entry')
      ON CONFLICT (name) DO NOTHING
    `);
    
    console.log('✅ Default payment method types inserted');
    
    // Show results
    const result = await client.query('SELECT * FROM payment_method_types ORDER BY id');
    console.log('\n📋 Payment Method Types:');
    result.rows.forEach(row => {
      console.log(`  ${row.id}. ${row.display_name} (${row.name}) - ${row.description}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createPaymentMethodTypesTable();
