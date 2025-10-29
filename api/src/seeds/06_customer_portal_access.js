/**
 * Seed script to reset customer passwords
 * Customers are created in 01_initial_data.js
 * This seed just ensures their passwords are reset to Admin@123
 */

const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Get ACME Corporation tenant ID dynamically
  const tenant = await knex('tenants').where('subdomain', 'acme').first();
  
  if (!tenant) {
    console.log('⏭️ No ACME Corporation tenant found, skipping customer password reset');
    return;
  }
  
  const tenantId = tenant.id;
  const defaultPassword = 'Admin@123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  console.log('🔄 Resetting customer passwords...\n');

  // Get all customers for this tenant
  const customers = await knex('customers')
    .where('tenant_id', tenantId)
    .whereNotNull('user_id');

  for (const customer of customers) {
    // Reset password for user account (Knex returns camelCase)
    await knex('users')
      .where('id', customer.userId)  // camelCase from Knex
      .update({
        password_hash: passwordHash,
        status: 'active',
        email_verified: true
      });
    console.log(`✅ Reset password for: ${customer.email}`);
  }

  console.log('\n✅ Customer password reset complete!');
  console.log('\n📝 Test Login Credentials (All use same password):');
  console.log(`   Password: ${defaultPassword}`);
  console.log(`   Login URL: http://localhost:4200/customer/login\n`);
  console.log('Customer Accounts:');
  customers.forEach((customer, index) => {
    console.log(`   ${index + 1}. ${customer.email} - ${customer.firstName} ${customer.lastName}`);  // camelCase
  });
  console.log('');
};
