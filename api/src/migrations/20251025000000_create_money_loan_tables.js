/**
 * Money Loan Product - Database Migration
 * Creates all tables required for Money Loan functionality
 */

exports.up = function(knex) {
  return knex.schema
    // 1. Loan Products - Different types of loans offered
    .createTable('loan_products', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.string('product_code', 50).notNullable();
      table.string('name', 100).notNullable();
      table.text('description');
      table.decimal('min_amount', 15, 2).notNullable();
      table.decimal('max_amount', 15, 2).notNullable();
      table.decimal('interest_rate', 5, 2).notNullable();
      table.enum('interest_type', ['flat', 'reducing', 'compound']).defaultTo('reducing');
      table.integer('min_term_days').notNullable();
      table.integer('max_term_days').notNullable();
      table.decimal('processing_fee_percent', 5, 2).defaultTo(0);
      table.decimal('late_payment_penalty_percent', 5, 2).defaultTo(0);
      table.integer('grace_period_days').defaultTo(0);
      table.boolean('is_active').defaultTo(true);
      table.jsonb('required_documents');
      table.jsonb('eligibility_criteria');
      table.jsonb('metadata');
      table.timestamps(true, true);
      table.unique(['tenant_id', 'product_code']);
    })

    // 2. Loan Applications (customers table is created in separate migration)
    .createTable('loan_applications', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.string('application_number', 50).notNullable();
      table.integer('customer_id').unsigned().notNullable()
        .references('id').inTable('customers').onDelete('RESTRICT');
      table.integer('loan_product_id').unsigned().notNullable()
        .references('id').inTable('loan_products').onDelete('RESTRICT');
      table.decimal('requested_amount', 15, 2).notNullable();
      table.integer('requested_term_days').notNullable();
      table.string('purpose', 200);
      table.enum('status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled'])
        .defaultTo('draft');
      table.integer('reviewed_by').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('reviewed_at');
      table.text('review_notes');
      table.decimal('approved_amount', 15, 2);
      table.integer('approved_term_days');
      table.decimal('approved_interest_rate', 5, 2);
      table.jsonb('application_data');
      table.jsonb('credit_assessment');
      table.timestamps(true, 2);
      table.unique(['tenant_id', 'application_number']);
      table.index(['tenant_id', 'customer_id']);
      table.index(['tenant_id', 'status']);
    })

    // 4. Loans
    .createTable('loans', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.string('loan_number', 50).notNullable();
      table.integer('customer_id').unsigned().notNullable()
        .references('id').inTable('customers').onDelete('RESTRICT');
      table.integer('loan_product_id').unsigned().notNullable()
        .references('id').inTable('loan_products').onDelete('RESTRICT');
      table.integer('application_id').unsigned()
        .references('id').inTable('loan_applications').onDelete('SET NULL');
      table.decimal('principal_amount', 15, 2).notNullable();
      table.decimal('interest_rate', 5, 2).notNullable();
      table.enum('interest_type', ['flat', 'reducing', 'compound']).notNullable();
      table.integer('term_days').notNullable();
      table.decimal('processing_fee', 15, 2).defaultTo(0);
      table.decimal('total_interest', 15, 2).notNullable();
      table.decimal('total_amount', 15, 2).notNullable();
      table.decimal('monthly_payment', 15, 2);
      table.date('disbursement_date');
      table.date('first_payment_date');
      table.date('maturity_date');
      table.decimal('amount_paid', 15, 2).defaultTo(0);
      table.decimal('outstanding_balance', 15, 2).notNullable();
      table.decimal('penalty_amount', 15, 2).defaultTo(0);
      table.enum('status', ['pending', 'disbursed', 'active', 'overdue', 'defaulted', 'paid_off', 'cancelled'])
        .defaultTo('pending');
      table.integer('days_overdue').defaultTo(0);
      table.integer('approved_by').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.integer('disbursed_by').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.jsonb('metadata');
      table.timestamps(true, true);
      table.unique(['tenant_id', 'loan_number']);
      table.index(['tenant_id', 'customer_id']);
      table.index(['tenant_id', 'status']);
      table.index(['disbursement_date']);
      table.index(['maturity_date']);
    })

    // 5. Repayment Schedule
    .createTable('repayment_schedules', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.integer('loan_id').unsigned().notNullable()
        .references('id').inTable('loans').onDelete('CASCADE');
      table.integer('installment_number').notNullable();
      table.date('due_date').notNullable();
      table.decimal('principal_amount', 15, 2).notNullable();
      table.decimal('interest_amount', 15, 2).notNullable();
      table.decimal('total_amount', 15, 2).notNullable();
      table.decimal('amount_paid', 15, 2).defaultTo(0);
      table.decimal('outstanding_amount', 15, 2).notNullable();
      table.decimal('penalty_amount', 15, 2).defaultTo(0);
      table.enum('status', ['pending', 'partially_paid', 'paid', 'overdue']).defaultTo('pending');
      table.date('paid_date');
      table.integer('days_overdue').defaultTo(0);
      table.timestamps(true, true);
      table.index(['tenant_id', 'loan_id']);
      table.index(['due_date']);
      table.index(['status']);
    })

    // 6. Payments/Repayments
    .createTable('loan_payments', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.string('payment_reference', 100).notNullable();
      table.integer('loan_id').unsigned().notNullable()
        .references('id').inTable('loans').onDelete('RESTRICT');
      table.integer('customer_id').unsigned().notNullable()
        .references('id').inTable('customers').onDelete('RESTRICT');
      table.decimal('amount', 15, 2).notNullable();
      table.decimal('principal_amount', 15, 2).notNullable();
      table.decimal('interest_amount', 15, 2).notNullable();
      table.decimal('penalty_amount', 15, 2).defaultTo(0);
      table.enum('payment_method', ['cash', 'bank_transfer', 'check', 'online', 'mobile_money', 'other'])
        .notNullable();
      table.string('transaction_id', 100);
      table.date('payment_date').notNullable();
      table.enum('status', ['pending', 'completed', 'failed', 'refunded']).defaultTo('completed');
      table.integer('received_by').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.text('notes');
      table.jsonb('metadata');
      table.timestamps(true, true);
      table.unique(['tenant_id', 'payment_reference']);
      table.index(['tenant_id', 'loan_id']);
      table.index(['tenant_id', 'customer_id']);
      table.index(['payment_date']);
      table.index(['status']);
    })

    // 7. Loan Documents
    .createTable('loan_documents', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.integer('customer_id').unsigned().notNullable()
        .references('id').inTable('customers').onDelete('CASCADE');
      table.integer('loan_id').unsigned()
        .references('id').inTable('loans').onDelete('CASCADE');
      table.integer('application_id').unsigned()
        .references('id').inTable('loan_applications').onDelete('CASCADE');
      table.string('document_type', 100).notNullable();
      table.string('document_name', 255).notNullable();
      table.string('file_path', 500).notNullable();
      table.string('file_type', 50);
      table.integer('file_size');
      table.enum('status', ['pending', 'verified', 'rejected']).defaultTo('pending');
      table.integer('verified_by').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('verified_at');
      table.text('notes');
      table.timestamps(true, true);
      table.index(['tenant_id', 'customer_id']);
      table.index(['loan_id']);
      table.index(['application_id']);
    })

    // 8. Collection Activities
    .createTable('collection_activities', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.integer('loan_id').unsigned().notNullable()
        .references('id').inTable('loans').onDelete('CASCADE');
      table.integer('customer_id').unsigned().notNullable()
        .references('id').inTable('customers').onDelete('RESTRICT');
      table.enum('activity_type', ['call', 'sms', 'email', 'visit', 'legal_notice', 'other'])
        .notNullable();
      table.date('activity_date').notNullable();
      table.text('notes');
      table.enum('outcome', ['contacted', 'promised_payment', 'payment_made', 'no_response', 'refused', 'other']);
      table.date('promised_payment_date');
      table.integer('performed_by').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);
      table.index(['tenant_id', 'loan_id']);
      table.index(['activity_date']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('collection_activities')
    .dropTableIfExists('loan_documents')
    .dropTableIfExists('loan_payments')
    .dropTableIfExists('repayment_schedules')
    .dropTableIfExists('loans')
    .dropTableIfExists('loan_applications')
    .dropTableIfExists('loan_products');
};
