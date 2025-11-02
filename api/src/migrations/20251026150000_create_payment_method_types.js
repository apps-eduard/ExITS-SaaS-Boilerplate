/**
 * Migration: Create payment_method_types table
 * This table stores available payment method types (Stripe, PayPal, GCash, etc.)
 * that tenants can select for their subscriptions
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('Creating payment_method_types table...');
  
  // Create payment_method_types table
  await knex.schema.createTable('payment_method_types', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable().unique().comment('Unique identifier for payment method (e.g., stripe, gcash)');
    table.string('display_name', 255).notNullable().comment('Human-readable name shown in UI');
    table.text('description').comment('Description of the payment method');
    table.boolean('is_active').defaultTo(true).comment('Whether this payment method is currently available');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  console.log('✅ payment_method_types table created');

  // Insert default payment method types
  const paymentMethodTypes = [
    {
      name: 'stripe',
      display_name: 'Stripe',
      description: 'Credit/Debit Card via Stripe',
      is_active: true
    },
    {
      name: 'paypal',
      display_name: 'PayPal',
      description: 'PayPal Account',
      is_active: true
    },
    {
      name: 'gcash',
      display_name: 'GCash',
      description: 'GCash Mobile Wallet',
      is_active: true
    },
    {
      name: 'bank_transfer',
      display_name: 'Bank Transfer',
      description: 'Direct Bank Transfer',
      is_active: true
    },
    {
      name: 'manual',
      display_name: 'Manual Payment',
      description: 'Offline/Manual Payment Entry',
      is_active: true
    }
  ];

  await knex('payment_method_types').insert(paymentMethodTypes);
  console.log('✅ Inserted 5 default payment method types');

  // Log the payment methods
  console.log('\n📋 Available Payment Methods:');
  const methods = await knex('payment_method_types').select('*').orderBy('id');
  methods.forEach(method => {
    console.log(`  ${method.id}. ${method.display_name} (${method.name}) - ${method.description}`);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  console.log('Dropping payment_method_types table...');
  await knex.schema.dropTableIfExists('payment_method_types');
  console.log('✅ payment_method_types table dropped');
};
