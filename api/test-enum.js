const knex = require('./src/config/database');

async function testEnumCreation() {
  try {
    console.log('Testing enum creation...');
    await knex.raw(`CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted')`);
    console.log('✓ user_status created successfully');
  } catch (error) {
    console.log('Error creating user_status:', error.message);
    if (error.message.includes('already exists')) {
      console.log('  → Type already exists, this is expected');
    }
  }
  
  try {
    await knex.raw(`CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'deleted')`);
    console.log('✓ tenant_status created successfully');
  } catch (error) {
    console.log('Error creating tenant_status:', error.message);
    if (error.message.includes('already exists')) {
      console.log('  → Type already exists, this is expected');
    }
  }
  
  process.exit(0);
}

testEnumCreation();