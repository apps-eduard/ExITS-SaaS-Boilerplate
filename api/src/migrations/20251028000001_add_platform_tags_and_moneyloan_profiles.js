/**
 * Add platform tags to customers and create Money Loan customer profiles
 */

exports.up = function(knex) {
  return knex.schema
    // Add platform_tags to customers table for fast filtering
    .table('customers', (table) => {
      table.jsonb('platform_tags').defaultTo('[]')
        .comment('Array of platforms customer is enrolled in: ["moneyloan", "bnpl", "pawnshop"]');
      
      table.index('platform_tags', 'idx_customers_platform_tags', 'GIN');
    })
    
    // Create Money Loan customer profiles (platform-specific data)
    .createTable('money_loan_customer_profiles', (table) => {
      table.increments('id').primary();
      table.integer('customer_id').unsigned().notNullable()
        .references('id').inTable('customers').onDelete('CASCADE')
        .comment('Reference to unified customers table');
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      
      // Financial/Credit Information (Money Loan specific)
      table.integer('credit_score').defaultTo(650)
        .comment('Credit score from 300-850');
      table.enum('risk_level', ['low', 'medium', 'high']).defaultTo('medium');
      table.decimal('total_debt', 15, 2).defaultTo(0);
      table.boolean('has_existing_loans').defaultTo(false);
      
      // KYC (Know Your Customer) - Platform specific
      table.enum('kyc_status', ['pending', 'verified', 'rejected', 'expired']).defaultTo('pending');
      table.timestamp('kyc_verified_at');
      table.integer('kyc_verified_by').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.text('kyc_notes');
      table.date('kyc_expiry_date');
      
      // Reference Information - Money Loan specific
      table.string('reference_name', 200);
      table.string('reference_phone', 50);
      table.string('reference_relationship', 50);
      table.string('reference_address', 500);
      
      // Additional Reference (2nd reference)
      table.string('reference2_name', 200);
      table.string('reference2_phone', 50);
      table.string('reference2_relationship', 50);
      table.string('reference2_address', 500);
      
      // Money Loan Preferences
      table.integer('preferred_loan_term').comment('Preferred loan term in months');
      table.decimal('max_loan_amount', 15, 2).comment('Maximum approved loan amount');
      table.decimal('current_loan_limit', 15, 2).comment('Current available limit');
      
      // Money Loan Statistics
      table.integer('total_loans_count').defaultTo(0);
      table.decimal('total_amount_borrowed', 15, 2).defaultTo(0);
      table.decimal('total_amount_paid', 15, 2).defaultTo(0);
      table.decimal('outstanding_balance', 15, 2).defaultTo(0);
      table.integer('active_loans_count').defaultTo(0);
      table.integer('completed_loans_count').defaultTo(0);
      table.integer('defaulted_loans_count').defaultTo(0);
      
      // Performance Metrics
      table.decimal('on_time_payment_rate', 5, 2).defaultTo(100)
        .comment('Percentage of on-time payments');
      table.integer('late_payment_count').defaultTo(0);
      table.integer('days_past_due_max').defaultTo(0);
      table.date('last_loan_date');
      table.date('last_payment_date');
      
      // Money Loan Specific Settings
      table.boolean('auto_debit_enabled').defaultTo(false);
      table.string('preferred_payment_method', 50);
      table.integer('preferred_payment_day').comment('Preferred day of month for payment');
      
      // Status
      table.enum('status', ['active', 'suspended', 'blocked', 'inactive']).defaultTo('active');
      table.text('notes');
      table.text('internal_notes').comment('Internal staff notes');
      
      // Timestamps
      table.timestamp('enrolled_at').defaultTo(knex.fn.now());
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.unique(['customer_id', 'tenant_id'], 'unique_moneyloan_customer_tenant');
      table.index('tenant_id');
      table.index('status');
      table.index('kyc_status');
      table.index('credit_score');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('money_loan_customer_profiles')
    .table('customers', (table) => {
      table.dropColumn('platform_tags');
    });
};
