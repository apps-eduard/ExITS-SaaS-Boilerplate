/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Create additional enums for products and subscriptions
  const enumTypes = [
    { name: 'product_type', values: ['money_loan', 'bnpl', 'pawnshop'] },
    { name: 'product_subscription_status', values: ['active', 'suspended', 'cancelled', 'expired'] },
    { name: 'billing_cycle_type', values: ['monthly', 'quarterly', 'yearly', 'one_time'] },
    { name: 'plan_status', values: ['active', 'inactive', 'deprecated'] },
    { name: 'subscription_status', values: ['active', 'suspended', 'cancelled', 'expired', 'pending'] },
    { name: 'payment_status', values: ['pending', 'completed', 'failed', 'refunded', 'cancelled'] },
    { name: 'invoice_status', values: ['draft', 'sent', 'paid', 'overdue', 'cancelled'] }
  ];

  for (const enumType of enumTypes) {
    const existsQuery = `
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = '${enumType.name}'
      );
    `;
    
    const result = await knex.raw(existsQuery);
    const exists = result.rows[0].exists;
    
    if (!exists) {
      const valuesStr = enumType.values.map(v => `'${v}'`).join(', ');
      await knex.raw(`CREATE TYPE ${enumType.name} AS ENUM (${valuesStr})`);
      console.log(`✓ Created enum type: ${enumType.name}`);
    } else {
      console.log(`✓ Enum type already exists: ${enumType.name}`);
    }
  }

  // Create subscription_plans table
  await knex.schema.createTable('subscription_plans', function (table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.text('description');
    table.decimal('price', 10, 2).defaultTo(0.00);
    table.specificType('billing_cycle', 'billing_cycle_type').defaultTo('monthly');
    table.integer('max_users').defaultTo(10);
    table.integer('max_storage_gb').defaultTo(5);
    table.jsonb('features').defaultTo('{}');
    table.specificType('status', 'plan_status').defaultTo('active');
    table.boolean('is_popular').defaultTo(false);
    table.decimal('setup_fee', 10, 2).defaultTo(0.00);
    table.text('terms_and_conditions');
    table.timestamps(true, true);
  });

  // Create plan_features table  
  await knex.schema.createTable('plan_features', function (table) {
    table.increments('id').primary();
    table.integer('plan_id').references('id').inTable('subscription_plans').onDelete('CASCADE');
    table.string('feature_key', 100).notNullable();
    table.string('feature_name', 255).notNullable();
    table.text('description');
    table.string('feature_value', 255).defaultTo('true');
    table.boolean('is_enabled').defaultTo(true);
    table.integer('limit_value').defaultTo(null);
    table.timestamps(true, true);
  });

  // Create tenant_subscriptions table
  await knex.schema.createTable('tenant_subscriptions', function (table) {
    table.increments('id').primary();
    table.integer('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('plan_id').references('id').inTable('subscription_plans').onDelete('RESTRICT');
    table.specificType('status', 'subscription_status').defaultTo('active');
    table.decimal('monthly_price', 10, 2).notNullable();
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at');
    table.timestamp('next_billing_date');
    table.timestamp('cancelled_at');
    table.string('cancellation_reason', 500);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
  });

  // Create product_subscriptions table
  await knex.schema.createTable('product_subscriptions', function (table) {
    table.increments('id').primary();
    table.integer('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.specificType('product_type', 'product_type').notNullable();
    table.integer('subscription_plan_id').references('id').inTable('subscription_plans');
    table.specificType('status', 'product_subscription_status').defaultTo('active');
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at');
    table.decimal('price', 10, 2).defaultTo(0.00);
    table.specificType('billing_cycle', 'billing_cycle_type').defaultTo('monthly');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
    
    table.unique(['tenant_id', 'product_type']);
  });

  // Create invoices table
  await knex.schema.createTable('invoices', function (table) {
    table.increments('id').primary();
    table.integer('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('subscription_id').references('id').inTable('tenant_subscriptions').onDelete('SET NULL');
    table.string('invoice_number', 50).unique().notNullable();
    table.specificType('status', 'invoice_status').defaultTo('draft');
    table.decimal('subtotal', 10, 2).notNullable();
    table.decimal('tax_amount', 10, 2).defaultTo(0.00);
    table.decimal('total_amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.date('issue_date').notNullable();
    table.date('due_date').notNullable();
    table.date('paid_date');
    table.text('notes');
    table.jsonb('line_items').defaultTo('[]');
    table.timestamps(true, true);
  });

  // Create payment_methods table
  await knex.schema.createTable('payment_methods', function (table) {
    table.increments('id').primary();
    table.integer('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.string('type', 50).notNullable(); // 'credit_card', 'bank_account', 'paypal', etc.
    table.string('provider', 50).notNullable(); // 'stripe', 'paypal', 'square', etc.
    table.string('external_id', 255); // Provider's payment method ID
    table.string('last_four', 4);
    table.string('brand', 50);
    table.integer('exp_month');
    table.integer('exp_year');
    table.boolean('is_default').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
  });

  // Create payment_history table
  await knex.schema.createTable('payment_history', function (table) {
    table.increments('id').primary();
    table.integer('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('invoice_id').references('id').inTable('invoices').onDelete('SET NULL');
    table.integer('payment_method_id').references('id').inTable('payment_methods').onDelete('SET NULL');
    table.string('transaction_id', 255).unique();
    table.string('external_transaction_id', 255);
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.specificType('status', 'payment_status').defaultTo('pending');
    table.string('provider', 50).notNullable();
    table.text('failure_reason');
    table.timestamp('processed_at');
    table.jsonb('provider_response').defaultTo('{}');
    table.timestamps(true, true);
  });

  // Create webhook_events table
  await knex.schema.createTable('webhook_events', function (table) {
    table.increments('id').primary();
    table.string('provider', 50).notNullable();
    table.string('event_type', 100).notNullable();
    table.string('external_id', 255);
    table.jsonb('payload').notNullable();
    table.string('status', 20).defaultTo('pending');
    table.text('error_message');
    table.integer('retry_count').defaultTo(0);
    table.timestamp('processed_at');
    table.timestamps(true, true);
  });

  // Create indexes for better performance
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_product_subscriptions_tenant ON product_subscriptions(tenant_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_product_subscriptions_status ON product_subscriptions(status)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_payment_history_tenant ON payment_history(tenant_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status)');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('webhook_events');
  await knex.schema.dropTableIfExists('payment_history');
  await knex.schema.dropTableIfExists('payment_methods');
  await knex.schema.dropTableIfExists('invoices');
  await knex.schema.dropTableIfExists('product_subscriptions');
  await knex.schema.dropTableIfExists('tenant_subscriptions');
  await knex.schema.dropTableIfExists('plan_features');
  await knex.schema.dropTableIfExists('subscription_plans');
  
  // Drop custom types
  await knex.raw('DROP TYPE IF EXISTS product_type CASCADE');
  await knex.raw('DROP TYPE IF EXISTS product_subscription_status CASCADE');
  await knex.raw('DROP TYPE IF EXISTS billing_cycle_type CASCADE');
  await knex.raw('DROP TYPE IF EXISTS plan_status CASCADE');
  await knex.raw('DROP TYPE IF EXISTS subscription_status CASCADE');
  await knex.raw('DROP TYPE IF EXISTS payment_status CASCADE');
  await knex.raw('DROP TYPE IF EXISTS invoice_status CASCADE');
};
