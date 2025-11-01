const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'exits_saas_db',
    user: 'postgres',
    password: 'admin'
  }
});

async function testEnumCreation() {
  try {
    console.log('Testing enum creation...');
    await db.raw(`CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted')`);
    console.log('✓ user_status created successfully');
  } catch (error) {
    console.log('Error creating user_status:', error.message);
    if (error.message.includes('already exists')) {
      console.log('  → Type already exists, this is expected');
    }
  }
  
  try {
    await db.raw(`CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'deleted')`);
    console.log('✓ tenant_status created successfully');
  } catch (error) {
    console.log('Error creating tenant_status:', error.message);
    if (error.message.includes('already exists')) {
      console.log('  → Type already exists, this is expected');
    }
  }
  
  await db.destroy();
  process.exit(0);
}

testEnumCreation();