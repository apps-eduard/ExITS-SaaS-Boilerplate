/**
 * Verification script to check addresses table
 */

const knex = require('knex');
const knexConfig = require('./knexfile');

const db = knex(knexConfig.development);

async function verifyAddresses() {
  try {
    console.log('🔍 Verifying addresses table...\n');

    const addresses = await db('addresses as a')
      .join('customers as c', 'a.addressable_id', 'c.id')
      .where('a.addressable_type', 'customer')
      .select(
        'a.id',
        'a.addressable_type',
        'a.addressable_id',
        'c.customer_code',
        'c.first_name',
        'c.last_name',
        'a.address_type',
        'a.house_number',
        'a.street_name',
        'a.barangay',
        'a.city_municipality',
        'a.province',
        'a.region',
        'a.zip_code',
        'a.is_primary',
        'a.is_verified'
      )
      .orderBy('c.customer_code');

    console.log(`✅ Found ${addresses.length} customer addresses\n`);

    addresses.forEach(addr => {
      console.log(`Customer: ${addr.customer_code} - ${addr.first_name} ${addr.last_name}`);
      console.log(`  Address: ${addr.house_number} ${addr.street_name}`);
      console.log(`  Barangay: ${addr.barangay}, ${addr.city_municipality}`);
      console.log(`  Province: ${addr.province}, Region: ${addr.region}`);
      console.log(`  Zip: ${addr.zip_code}`);
      console.log(`  Type: ${addr.address_type}, Primary: ${addr.is_primary}, Verified: ${addr.is_verified}\n`);
    });

    // Check if customers table still has address fields
    const customerFields = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      AND column_name IN ('address', 'barangay', 'city', 'province', 'postal_code')
      ORDER BY column_name
    `);

    if (customerFields.rows.length > 0) {
      console.log('⚠️  WARNING: Customers table still has old address fields:');
      customerFields.rows.forEach(row => console.log(`  - ${row.column_name}`));
      console.log('   These should be removed in the migration.\n');
    } else {
      console.log('✅ Customers table properly migrated (no embedded address fields)\n');
    }

    await db.destroy();
    console.log('✅ Verification complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await db.destroy();
    process.exit(1);
  }
}

verifyAddresses();
