/**
 * Migration: Create Money Loan Collector Management Tables
 * Date: 2025-11-05
 * 
 * Creates tables for collector limits, action logs, penalty waivers,
 * daily summaries, and customer visits tracking.
 */

exports.up = async function(knex) {
  // 1. Create money_loan_collector_limits table
  await knex.schema.createTable('money_loan_collector_limits', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    
    // Approval limits
    table.decimal('max_approval_amount', 15, 2).defaultTo(50000.00);
    table.integer('max_approval_per_day').defaultTo(10);
    
    // Disbursement limits
    table.decimal('max_disbursement_amount', 15, 2).defaultTo(100000.00);
    table.decimal('daily_disbursement_limit', 15, 2).defaultTo(500000.00);
    table.decimal('monthly_disbursement_limit', 15, 2).defaultTo(5000000.00);
    
    // Penalty waiver limits
    table.decimal('max_penalty_waiver_amount', 15, 2).defaultTo(5000.00);
    table.decimal('max_penalty_waiver_percent', 5, 2).defaultTo(50.00);
    table.decimal('requires_manager_approval_above', 15, 2).defaultTo(2000.00);
    
    // Payment collection limits
    table.decimal('max_cash_collection_per_transaction', 15, 2).defaultTo(50000.00);
    
    table.boolean('is_active').defaultTo(true);
    table.date('effective_from');
    table.date('effective_to');
    
    table.timestamps(true, true);
    table.integer('created_by').references('id').inTable('users');
    table.integer('updated_by').references('id').inTable('users');
    
    table.unique(['tenant_id', 'user_id']);
  });

  await knex.schema.raw('CREATE INDEX idx_money_loan_collector_limits_tenant_user ON money_loan_collector_limits(tenant_id, user_id)');
  await knex.schema.raw('CREATE INDEX idx_money_loan_collector_limits_active ON money_loan_collector_limits(is_active)');

  console.log('✓ Created money_loan_collector_limits table');

  // 2. Create money_loan_collector_action_logs table
  await knex.schema.createTable('money_loan_collector_action_logs', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('collector_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('customer_id').notNullable().references('id').inTable('customers').onDelete('CASCADE');
    
    table.string('action_type', 50).notNullable(); // 'approve_application', 'disburse_loan', 'collect_payment', 'waive_penalty', 'add_collection_note'
    
    // Related records
    table.integer('application_id').references('id').inTable('money_loan_applications').onDelete('SET NULL');
    table.integer('loan_id').references('id').inTable('money_loan_loans').onDelete('SET NULL');
    table.integer('payment_id').references('id').inTable('money_loan_payments').onDelete('SET NULL');
    
    // Action details
    table.decimal('amount', 15, 2);
    table.jsonb('previous_value'); // Store old state for audit
    table.jsonb('new_value');      // Store new state for audit
    
    // Status tracking
    table.string('status', 50).defaultTo('success'); // 'success', 'failed', 'pending_approval', 'rejected'
    table.text('rejection_reason');
    table.integer('approved_by').references('id').inTable('users');
    table.timestamp('approved_at');
    
    // Additional context
    table.text('notes');
    table.decimal('location_lat', 10, 8);
    table.decimal('location_lng', 11, 8);
    table.jsonb('device_info');
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX idx_money_loan_collector_action_logs_tenant_collector ON money_loan_collector_action_logs(tenant_id, collector_id)');
  await knex.schema.raw('CREATE INDEX idx_money_loan_collector_action_logs_customer ON money_loan_collector_action_logs(customer_id)');
  await knex.schema.raw('CREATE INDEX idx_money_loan_collector_action_logs_action_type ON money_loan_collector_action_logs(action_type)');
  await knex.schema.raw('CREATE INDEX idx_money_loan_collector_action_logs_date ON money_loan_collector_action_logs(created_at DESC)');
  await knex.schema.raw('CREATE INDEX idx_money_loan_collector_action_logs_loan ON money_loan_collector_action_logs(loan_id)');

  console.log('✓ Created money_loan_collector_action_logs table');

  // 3. Create money_loan_penalty_waivers table
  await knex.schema.createTable('money_loan_penalty_waivers', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('loan_id').notNullable().references('id').inTable('money_loan_loans').onDelete('CASCADE');
    table.integer('customer_id').notNullable().references('id').inTable('customers').onDelete('CASCADE');
    
    // Waiver details
    table.decimal('original_penalty_amount', 15, 2).notNullable();
    table.decimal('waived_amount', 15, 2).notNullable();
    table.decimal('remaining_penalty', 15, 2).notNullable();
    table.decimal('waiver_percentage', 5, 2);
    
    // Reason & justification
    table.string('reason', 100).notNullable(); // 'goodwill', 'system_error', 'first_time_offender', 'financial_hardship', 'dispute', 'other'
    table.text('detailed_justification').notNullable();
    table.jsonb('supporting_documents'); // Array of document URLs/references
    
    // Approval workflow
    table.integer('requested_by').notNullable().references('id').inTable('users'); // Collector who requested
    table.timestamp('requested_at').defaultTo(knex.fn.now());
    
    table.string('status', 50).defaultTo('pending'); // 'pending', 'approved', 'rejected', 'cancelled'
    
    table.integer('approved_by').references('id').inTable('users'); // Manager/Admin who approved
    table.timestamp('approved_at');
    table.text('rejection_reason');
    
    // Impact tracking
    table.text('customer_payment_behavior_before'); // 'good', 'fair', 'poor'
    table.text('customer_payment_behavior_after');  // Track if waiver improved payment behavior
    
    table.timestamps(true, true);
  });

  await knex.schema.raw('CREATE INDEX idx_money_loan_penalty_waivers_tenant_loan ON money_loan_penalty_waivers(tenant_id, loan_id)');
  await knex.schema.raw('CREATE INDEX idx_money_loan_penalty_waivers_customer ON money_loan_penalty_waivers(customer_id)');
  await knex.schema.raw('CREATE INDEX idx_money_loan_penalty_waivers_status ON money_loan_penalty_waivers(status)');
  await knex.schema.raw('CREATE INDEX idx_money_loan_penalty_waivers_requested_by ON money_loan_penalty_waivers(requested_by)');
  await knex.schema.raw('CREATE INDEX idx_money_loan_penalty_waivers_date ON money_loan_penalty_waivers(created_at DESC)');

  console.log('✓ Created money_loan_penalty_waivers table');

  // 4. Create money_loan_collector_daily_summaries table
  await knex.schema.createTable('money_loan_collector_daily_summaries', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('collector_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.date('summary_date').notNullable();
    
    // Collections
    table.integer('total_collections_count').defaultTo(0);
    table.decimal('total_collections_amount', 15, 2).defaultTo(0);
    table.decimal('cash_collections', 15, 2).defaultTo(0);
    table.decimal('bank_transfer_collections', 15, 2).defaultTo(0);
    table.decimal('other_collections', 15, 2).defaultTo(0);
    
    // Disbursements
    table.integer('disbursements_count').defaultTo(0);
    table.decimal('disbursements_amount', 15, 2).defaultTo(0);
    
    // Approvals
    table.integer('approvals_count').defaultTo(0);
    table.decimal('approvals_amount', 15, 2).defaultTo(0);
    
    // Penalty waivers
    table.integer('penalty_waivers_count').defaultTo(0);
    table.decimal('penalty_waivers_amount', 15, 2).defaultTo(0);
    
    // Customer visits
    table.integer('customers_visited_count').defaultTo(0);
    table.integer('successful_visits').defaultTo(0);
    table.integer('failed_visits').defaultTo(0);
    
    // Compliance
    table.decimal('route_completion_percentage', 5, 2);
    table.integer('on_time_visits').defaultTo(0);
    table.integer('late_visits').defaultTo(0);
    
    // GPS tracking
    table.decimal('total_distance_km', 10, 2);
    table.decimal('start_location_lat', 10, 8);
    table.decimal('start_location_lng', 11, 8);
    table.decimal('end_location_lat', 10, 8);
    table.decimal('end_location_lng', 11, 8);
    
    table.timestamps(true, true);
    
    table.unique(['tenant_id', 'collector_id', 'summary_date']);
  });

  await knex.schema.raw('CREATE INDEX idx_money_loan_collector_daily_summaries_date ON money_loan_collector_daily_summaries(summary_date DESC)');
  await knex.schema.raw('CREATE INDEX idx_money_loan_collector_daily_summaries_collector ON money_loan_collector_daily_summaries(collector_id, summary_date DESC)');

  console.log('✓ Created money_loan_collector_daily_summaries table');

  // 5. Create money_loan_customer_visits table (used by collector daily summary queries)
  await knex.schema.createTable('money_loan_customer_visits', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('collector_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('customer_id').notNullable().references('id').inTable('customers').onDelete('CASCADE');
    
    table.date('scheduled_date');
    table.time('scheduled_time');
    
    table.timestamp('check_in_time'); // Used in daily summary query
    table.timestamp('check_out_time');
    table.integer('visit_duration_minutes');
    
    // GPS verification
    table.decimal('customer_location_lat', 10, 8);
    table.decimal('customer_location_lng', 11, 8);
    table.decimal('visit_location_lat', 10, 8);
    table.decimal('visit_location_lng', 11, 8);
    table.decimal('distance_from_customer_meters', 10, 2);
    table.boolean('is_location_verified').defaultTo(false);
    
    // Visit outcome
    table.string('visit_type', 50); // 'collection', 'follow_up', 'new_application', 'document_collection', 'dispute_resolution'
    table.string('status', 50).defaultTo('scheduled'); // 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'
    
    table.decimal('amount_collected', 15, 2).defaultTo(0);
    table.integer('payment_id').references('id').inTable('money_loan_payments');
    
    table.date('next_visit_date');
    table.text('notes');
    table.jsonb('photos'); // Array of photo URLs taken during visit
    table.text('customer_signature'); // Base64 or URL
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX idx_money_loan_customer_visits_date ON money_loan_customer_visits(scheduled_date)');
  await knex.schema.raw('CREATE INDEX idx_money_loan_customer_visits_collector ON money_loan_customer_visits(collector_id, scheduled_date)');
  await knex.schema.raw('CREATE INDEX idx_money_loan_customer_visits_customer ON money_loan_customer_visits(customer_id)');
  await knex.schema.raw('CREATE INDEX idx_money_loan_customer_visits_status ON money_loan_customer_visits(status)');
  await knex.schema.raw('CREATE INDEX idx_money_loan_customer_visits_check_in ON money_loan_customer_visits(check_in_time)');

  console.log('✓ Created money_loan_customer_visits table');

  // 6. Add penalty waiver fields to existing tables (if not already exist)
  const hasLoansPenaltyWaived = await knex.schema.hasColumn('money_loan_loans', 'penalty_waived_amount');
  
  if (!hasLoansPenaltyWaived) {
    await knex.schema.alterTable('money_loan_loans', table => {
      table.decimal('penalty_waived_amount', 15, 2).defaultTo(0);
      table.integer('penalty_waived_by').references('id').inTable('users');
      table.timestamp('penalty_waived_at');
      table.text('penalty_waiver_reason');
    });
    console.log('✓ Added penalty waiver fields to money_loan_loans table');
  } else {
    console.log('ℹ️ Penalty waiver fields already exist in money_loan_loans table');
  }

  const hasSchedulesPenaltyWaived = await knex.schema.hasColumn('money_loan_repayment_schedules', 'penalty_waived_amount');
  
  if (!hasSchedulesPenaltyWaived) {
    await knex.schema.alterTable('money_loan_repayment_schedules', table => {
      table.decimal('penalty_waived_amount', 15, 2).defaultTo(0);
      table.integer('penalty_waived_by').references('id').inTable('users');
      table.timestamp('penalty_waived_at');
    });
    console.log('✓ Added penalty waiver fields to money_loan_repayment_schedules table');
  } else {
    console.log('ℹ️ Penalty waiver fields already exist in money_loan_repayment_schedules table');
  }

  console.log('✅ Collector management tables created successfully');
};

exports.down = async function(knex) {
  // Remove penalty waiver fields from existing tables (if they were added by this migration)
  const hasSchedulesPenaltyWaived = await knex.schema.hasColumn('money_loan_repayment_schedules', 'penalty_waived_amount');
  if (hasSchedulesPenaltyWaived) {
    await knex.schema.alterTable('money_loan_repayment_schedules', table => {
      table.dropColumn('penalty_waived_amount');
      table.dropColumn('penalty_waived_by');
      table.dropColumn('penalty_waived_at');
    });
  }

  const hasLoansPenaltyWaived = await knex.schema.hasColumn('money_loan_loans', 'penalty_waived_amount');
  if (hasLoansPenaltyWaived) {
    await knex.schema.alterTable('money_loan_loans', table => {
      table.dropColumn('penalty_waived_amount');
      table.dropColumn('penalty_waived_by');
      table.dropColumn('penalty_waived_at');
      table.dropColumn('penalty_waiver_reason');
    });
  }

  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('money_loan_customer_visits');
  await knex.schema.dropTableIfExists('money_loan_collector_daily_summaries');
  await knex.schema.dropTableIfExists('money_loan_penalty_waivers');
  await knex.schema.dropTableIfExists('money_loan_collector_action_logs');
  await knex.schema.dropTableIfExists('money_loan_collector_limits');

  console.log('✓ Dropped collector management tables');
};
