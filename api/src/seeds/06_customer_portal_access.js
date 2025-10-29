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

  // Get all customers for this tenant with their user IDs
  const customers = await knex('customers')
    .select('*')
    .where('tenant_id', tenantId)
    .whereNotNull('user_id');

  for (const customer of customers) {
    // Handle both camelCase (if Knex converts) and snake_case
    const userId = customer.userId || customer.user_id;
    
    if (!userId) {
      console.log(`⚠️ Skipping customer ${customer.email} - no user_id`);
      continue;
    }

    // Reset password for user account
    await knex('users')
      .where('id', userId)
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
    const firstName = customer.firstName || customer.first_name;
    const lastName = customer.lastName || customer.last_name;
    console.log(`   ${index + 1}. ${customer.email} - ${firstName} ${lastName}`);
  });
  console.log('');
};
