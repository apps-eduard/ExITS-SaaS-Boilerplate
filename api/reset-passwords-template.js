const bcrypt = require('bcrypt');
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'exits_saas_db',
    user: 'postgres',
    password: 'REPLACE_DB_PASSWORD'
  }
});

async function resetPasswords() {
  try {
    console.log('Hashing new passwords...');
    
    // Admin passwords
    const systemAdminHash = await bcrypt.hash('REPLACE_SYSTEM_PASSWORD', 10);
    const tenantAdmin1Hash = await bcrypt.hash('REPLACE_TENANT1_PASSWORD', 10);
    const tenantAdmin2Hash = await bcrypt.hash('REPLACE_TENANT2_PASSWORD', 10);
    
    // Employee passwords (Employee@123)
    const employeeHash = await bcrypt.hash('Employee@123', 10);
    
    // Customer passwords (Customer@123) - for users table customers
    const customerHash = await bcrypt.hash('Customer@123', 10);
    
    console.log('Updating passwords in database...');
    
    // Update admin accounts
    await knex('users').where('email', 'admin@exitsaas.com').update({ password_hash: systemAdminHash });
    await knex('users').where('email', 'admin-1@example.com').update({ password_hash: tenantAdmin1Hash });
    await knex('users').where('email', 'admin-2@example.com').update({ password_hash: tenantAdmin2Hash });
    
    // Update employee accounts (if they exist)
    const employee1 = await knex('users').where('email', 'employee1@tenant1.com').first();
    if (employee1) {
      await knex('users').where('email', 'employee1@tenant1.com').update({ password_hash: employeeHash });
      console.log('✓ Updated employee1@tenant1.com password');
    }
    
    const employee2 = await knex('users').where('email', 'employee2@tenant1.com').first();
    if (employee2) {
      await knex('users').where('email', 'employee2@tenant1.com').update({ password_hash: employeeHash });
      console.log('✓ Updated employee2@tenant1.com password');
    }
    
    // Update customer accounts in users table (if they exist)
    const customerEmails = [
      'juan.delacruz@test.com',
      'maria.santos@test.com', 
      'pedro.gonzales@test.com',
      'customer1@test.com',
      'customer2@test.com'
    ];
    
    for (const email of customerEmails) {
      const customer = await knex('users').where('email', email).first();
      if (customer) {
        await knex('users').where('email', email).update({ password_hash: customerHash });
        console.log(`✓ Updated ${email} password`);
      }
    }
    
    console.log('✅ All user passwords updated successfully');
    await knex.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating passwords:', error.message);
    await knex.destroy();
    process.exit(1);
  }
}

resetPasswords();