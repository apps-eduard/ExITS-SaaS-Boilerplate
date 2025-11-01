/**
 * Create payment_methods table migration
 */

const pool = require('../config/database');

async function createPaymentMethodsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating payment_methods table...');

    // Create the table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    console.log('✅ payment_methods table created');

    // Insert default payment methods
    await client.query(`
      INSERT INTO payment_methods (name, display_name, description) VALUES
        ('stripe', 'Stripe', 'Credit/Debit Card via Stripe'),
        ('paypal', 'PayPal', 'PayPal Account'),
        ('bank_transfer', 'Bank Transfer', 'Direct Bank Transfer'),
        ('gcash', 'GCash', 'GCash Mobile Wallet'),
        ('manual', 'Manual Payment', 'Offline/Manual Payment Entry')
      ON CONFLICT (name) DO NOTHING;
    `);

    console.log('✅ Default payment methods inserted');

    // Verify the data
    const result = await client.query('SELECT * FROM payment_methods ORDER BY id');
    console.log(`\n📋 Payment methods in database (${result.rows.length}):`);
    result.rows.forEach(pm => {
      console.log(`  - ${pm.id}: ${pm.name} (${pm.display_name})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
createPaymentMethodsTable()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
