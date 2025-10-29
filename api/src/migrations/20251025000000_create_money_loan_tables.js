/**
 * Money Loan Product - Database Migration
 * Creates all tables required for Money Loan functionality
 */

exports.up = function(knex) {
  return knex.schema
    // 1. Loan Products - Different types of loans offered
    .createTable('money_loan_products', (table) => {
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
    .createTable('money_loan_applications', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.string('application_number', 50).notNullable();
      table.integer('customer_id').unsigned().notNullable()
        .references('id').inTable('customers').onDelete('RESTRICT');
      table.integer('loan_product_id').unsigned().notNullable()
        .references('id').inTable('money_loan_products').onDelete('RESTRICT');
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
    .createTable('money_loan_loans', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.string('loan_number', 50).notNullable();
      table.integer('customer_id').unsigned().notNullable()
        .references('id').inTable('customers').onDelete('RESTRICT');
      table.integer('loan_product_id').unsigned().notNullable()
        .references('id').inTable('money_loan_products').onDelete('RESTRICT');
      table.integer('application_id').unsigned()
        .references('id').inTable('money_loan_applications').onDelete('SET NULL');
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
    .createTable('money_loan_repayment_schedules', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.integer('loan_id').unsigned().notNullable()
        .references('id').inTable('money_loan_loans').onDelete('CASCADE');
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
    .createTable('money_loan_payments', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.string('payment_reference', 100).notNullable();
      table.integer('loan_id').unsigned().notNullable()
        .references('id').inTable('money_loan_loans').onDelete('RESTRICT');
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
    .createTable('money_loan_documents', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.integer('customer_id').unsigned().notNullable()
        .references('id').inTable('customers').onDelete('CASCADE');
      table.integer('loan_id').unsigned()
        .references('id').inTable('money_loan_loans').onDelete('CASCADE');
      table.integer('application_id').unsigned()
        .references('id').inTable('money_loan_applications').onDelete('CASCADE');
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
    .createTable('money_loan_collection_activities', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.integer('loan_id').unsigned().notNullable()
        .references('id').inTable('money_loan_loans').onDelete('CASCADE');
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
    })

    // 9. Money Loan Interest Rates Configuration
    .createTable('money_loan_interest_rates', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.integer('loan_product_id').unsigned().notNullable()
        .references('id').inTable('money_loan_products').onDelete('CASCADE');
      table.enum('interest_type', ['fixed', 'variable', 'declining_balance', 'flat_rate', 'compound']).defaultTo('fixed');
      table.decimal('base_rate', 5, 2).notNullable();
      table.string('market_index', 50);
      table.decimal('spread', 5, 2);
      table.json('rate_brackets');
      table.json('credit_score_rates');
      table.json('risk_based_rates');
      table.decimal('min_rate', 5, 2);
      table.decimal('max_rate', 5, 2);
      table.enum('calculation_method', ['simple', 'compound', 'daily', 'monthly', 'annually']).defaultTo('daily');
      table.enum('recalculation_frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'never']).defaultTo('never');
      table.integer('interest_grace_period_days').defaultTo(0);
      table.boolean('is_default').defaultTo(false);
      table.boolean('is_active').defaultTo(true);
      table.json('metadata');
      table.timestamps(true, true);
      table.index(['tenant_id', 'loan_product_id']);
      table.index(['interest_type']);
      table.index(['is_active']);
    })

    // 10. Money Loan Payment Schedules Configuration
    .createTable('money_loan_payment_schedules', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.integer('loan_product_id').unsigned().notNullable()
        .references('id').inTable('money_loan_products').onDelete('CASCADE');
      table.enum('payment_frequency', ['daily', 'weekly', 'bi_weekly', 'semi_monthly', 'monthly', 'quarterly', 'semi_annually', 'annually', 'custom']).defaultTo('monthly');
      table.enum('schedule_type', ['fixed', 'flexible']).defaultTo('fixed');
      table.enum('payment_allocation_order', ['interest_principal_fees', 'principal_interest_fees', 'fees_interest_principal', 'custom']).defaultTo('interest_principal_fees');
      table.integer('day_of_week');
      table.integer('day_of_month');
      table.integer('month_of_quarter');
      table.enum('holiday_handling', ['skip_to_next_business_day', 'prepone_to_previous_business_day', 'allow_on_weekend']).defaultTo('skip_to_next_business_day');
      table.decimal('minimum_payment_amount', 15, 2);
      table.decimal('minimum_payment_percentage', 5, 2);
      table.boolean('allow_early_payment').defaultTo(true);
      table.boolean('allow_skipped_payment').defaultTo(false);
      table.integer('max_skipped_payments_per_year').defaultTo(0);
      table.json('allowed_payment_methods');
      table.integer('grace_period_days').defaultTo(0);
      table.boolean('supports_auto_payment').defaultTo(true);
      table.enum('auto_payment_frequency', ['every_payment', 'specific_dates', 'never']).defaultTo('never');
      table.integer('max_installments');
      table.boolean('is_default').defaultTo(false);
      table.boolean('is_active').defaultTo(true);
      table.json('metadata');
      table.timestamps(true, true);
      table.index(['tenant_id', 'loan_product_id']);
      table.index(['payment_frequency']);
      table.index(['schedule_type']);
      table.index(['is_active']);
    })

    // 11. Money Loan Fees Configuration
    .createTable('money_loan_fees', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.integer('loan_product_id').unsigned().notNullable()
        .references('id').inTable('money_loan_products').onDelete('CASCADE');
      table.enum('fee_type', ['origination', 'processing', 'documentation', 'appraisal', 'insurance', 'late_payment', 'returned_payment', 'restructuring', 'early_settlement', 'statement_request', 'service_charge', 'account_maintenance', 'prepayment_penalty', 'other']).notNullable();
      table.string('fee_name', 100).notNullable();
      table.text('fee_description');
      table.enum('charge_type', ['fixed_amount', 'percentage_of_loan', 'percentage_of_payment', 'variable']).notNullable();
      table.decimal('fixed_amount', 15, 2);
      table.decimal('percentage_value', 5, 2);
      table.enum('late_payment_charge_method', ['fixed_per_day', 'fixed_per_month', 'percentage_per_day', 'percentage_per_month']);
      table.decimal('maximum_fee_amount', 15, 2);
      table.decimal('minimum_fee_amount', 15, 2);
      table.enum('charge_frequency', ['upfront', 'at_maturity', 'on_event', 'daily', 'weekly', 'monthly', 'quarterly', 'annually']).notNullable();
      table.json('applicable_conditions');
      table.boolean('is_optional').defaultTo(false);
      table.boolean('is_waivable').defaultTo(false);
      table.boolean('is_deferable').defaultTo(false);
      table.boolean('include_in_loan_amount').defaultTo(false);
      table.boolean('include_in_emi').defaultTo(false);
      table.string('account_code', 50);
      table.boolean('is_taxable').defaultTo(false);
      table.decimal('tax_percentage', 5, 2);
      table.integer('deduction_priority').defaultTo(100);
      table.boolean('is_active').defaultTo(true);
      table.json('metadata');
      table.timestamps(true, true);
      table.index(['tenant_id', 'loan_product_id']);
      table.index(['fee_type']);
      table.index(['is_active']);
    })

    // 12. Money Loan Approval Rules Configuration
    .createTable('money_loan_approval_rules', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.integer('loan_product_id').unsigned().notNullable()
        .references('id').inTable('money_loan_products').onDelete('CASCADE');
      table.string('rule_name', 100).notNullable();
      table.enum('rule_type', ['auto_approve', 'manual_review', 'manager_approval', 'committee_approval', 'escalation']).notNullable();
      table.decimal('min_loan_amount', 15, 2).defaultTo(0);
      table.decimal('max_loan_amount', 15, 2);
      table.integer('min_loan_term_days');
      table.integer('max_loan_term_days');
      table.json('auto_approval_criteria');
      table.integer('approval_levels').defaultTo(1);
      table.json('approver_roles');
      table.integer('approval_time_limit');
      table.string('escalation_rule', 255);
      table.boolean('collateral_required').defaultTo(false);
      table.decimal('min_collateral_to_loan_ratio', 5, 2);
      table.json('required_documents');
      table.boolean('kyc_required').defaultTo(true);
      table.boolean('income_verification_required').defaultTo(true);
      table.boolean('credit_bureau_check_required').defaultTo(true);
      table.boolean('risk_assessment_required').defaultTo(true);
      table.json('conditions');
      table.integer('priority').defaultTo(100);
      table.boolean('is_active').defaultTo(true);
      table.json('metadata');
      table.timestamps(true, true);
      table.index(['tenant_id', 'loan_product_id']);
      table.index(['rule_type']);
      table.index(['priority']);
      table.index(['is_active']);
    })

    // 13. Money Loan Modifications History
    .createTable('money_loan_modifications', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.integer('loan_id').unsigned().notNullable()
        .references('id').inTable('money_loan_loans').onDelete('RESTRICT');
      table.string('modification_number', 50).notNullable();
      table.enum('modification_type', ['term_extension', 'payment_adjustment', 'interest_rate_change', 'restructuring', 'consolidation', 'refinance', 'partial_prepayment', 'grace_period', 'payment_holiday', 'other']).notNullable();
      table.enum('status', ['requested', 'approved', 'rejected', 'pending_review', 'implemented', 'cancelled']).defaultTo('requested');
      table.enum('requested_by', ['customer', 'employee', 'system', 'manager']).notNullable();
      table.integer('requested_by_user_id').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.date('requested_date').notNullable();
      table.date('effective_date');
      table.decimal('original_principal_amount', 15, 2);
      table.integer('original_term_days');
      table.decimal('original_interest_rate', 5, 2);
      table.decimal('original_monthly_payment', 15, 2);
      table.date('original_maturity_date');
      table.decimal('new_principal_amount', 15, 2);
      table.integer('new_term_days');
      table.decimal('new_interest_rate', 5, 2);
      table.decimal('new_monthly_payment', 15, 2);
      table.date('new_maturity_date');
      table.integer('extension_months');
      table.text('payment_adjustment_reason');
      table.decimal('payment_adjustment_amount', 15, 2);
      table.decimal('interest_rate_change', 5, 2);
      table.string('interest_rate_change_reason', 255);
      table.integer('grace_period_days');
      table.date('grace_period_start_date');
      table.date('grace_period_end_date');
      table.integer('payment_holiday_months');
      table.date('payment_holiday_start_date');
      table.date('payment_holiday_end_date');
      table.decimal('total_interest_impact', 15, 2);
      table.decimal('total_payment_impact', 15, 2);
      table.text('modification_reason');
      table.integer('approved_by_user_id').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.date('approved_date');
      table.text('approval_notes');
      table.text('rejection_reason');
      table.integer('rejected_by_user_id').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.date('rejected_date');
      table.decimal('modification_fee', 15, 2).defaultTo(0);
      table.boolean('fees_waived').defaultTo(false);
      table.boolean('customer_consented').defaultTo(false);
      table.date('consent_date');
      table.boolean('schedule_regeneration_required').defaultTo(true);
      table.boolean('schedule_regenerated').defaultTo(false);
      table.json('related_document_ids');
      table.json('metadata');
      table.timestamps(true, true);
      table.unique(['tenant_id', 'modification_number']);
      table.index(['tenant_id', 'loan_id']);
      table.index(['modification_type']);
      table.index(['status']);
      table.index(['requested_date']);
      table.index(['effective_date']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('money_loan_modifications')
    .dropTableIfExists('money_loan_approval_rules')
    .dropTableIfExists('money_loan_fees')
    .dropTableIfExists('money_loan_payment_schedules')
    .dropTableIfExists('money_loan_interest_rates')
    .dropTableIfExists('money_loan_collection_activities')
    .dropTableIfExists('money_loan_documents')
    .dropTableIfExists('money_loan_payments')
    .dropTableIfExists('money_loan_repayment_schedules')
    .dropTableIfExists('money_loan_loans')
    .dropTableIfExists('money_loan_applications')
    .dropTableIfExists('money_loan_products');
};
