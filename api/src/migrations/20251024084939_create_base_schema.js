/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  const enumDefinitions = [
    { name: 'user_status', values: ['active', 'suspended', 'deleted'] },
    { name: 'role_space', values: ['system', 'tenant', 'customer'] },
    { name: 'tenant_status', values: ['active', 'suspended', 'deleted'] },
    { name: 'session_status', values: ['active', 'revoked', 'expired'] },
    { name: 'audit_status', values: ['success', 'failure', 'pending'] },
    { name: 'permission_status', values: ['active', 'conditional', 'revoked'] },
    { name: 'tenant_plan', values: ['starter', 'pro', 'enterprise', 'trial'] },
    { name: 'platform_type', values: ['money_loan', 'bnpl', 'pawnshop', 'platform'] },
    { name: 'billing_cycle_type', values: ['monthly', 'quarterly', 'yearly', 'one_time'] },
    { name: 'plan_status', values: ['active', 'inactive', 'deprecated'] }
  ];

  for (const enumType of enumDefinitions) {
    const existsQuery = `
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = '${enumType.name}'
      );
    `;

    const result = await knex.raw(existsQuery);
    if (!result.rows[0].exists) {
      const values = enumType.values.map(v => `'${v}'`).join(', ');
      await knex.raw(`CREATE TYPE ${enumType.name} AS ENUM (${values})`);
    }
  }

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE employment_type AS ENUM ('full-time', 'part-time', 'contract', 'probation', 'intern');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE employment_status AS ENUM ('active', 'on_leave', 'suspended', 'resigned', 'terminated');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE access_level AS ENUM ('view', 'create', 'edit', 'approve', 'manage', 'admin');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE product_access_status AS ENUM ('active', 'suspended', 'revoked');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE log_level AS ENUM ('debug', 'info', 'warning', 'error', 'critical');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE audit_action AS ENUM ('login', 'logout', 'create', 'update', 'delete', 'view', 'export', 'import', 'approve', 'reject');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await knex.schema.createTable('tenants', table => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('subdomain', 100).notNullable().unique();
    table.specificType('plan', 'tenant_plan').defaultTo('starter');
    table.specificType('status', 'tenant_status').defaultTo('active');
    table.string('logo_url', 500);
    table.string('primary_color', 7);
    table.string('secondary_color', 7);
    table.integer('max_users');
    table.string('data_residency', 50).defaultTo('US');
    table.string('billing_email', 255);
    table.jsonb('metadata').defaultTo('{}');
    table.string('contact_person', 255);
    table.string('contact_email', 255);
    table.string('contact_phone', 50);
    table.boolean('money_loan_enabled').defaultTo(false);
    table.boolean('bnpl_enabled').defaultTo(false);
    table.boolean('pawnshop_enabled').defaultTo(false);
    table.timestamps(true, true);
    table.unique(['contact_email'], 'tenants_contact_email_unique');
  });

  await knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.integer('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.string('email', 255).notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('phone', 20);
    table.specificType('status', 'user_status').defaultTo('active');
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('email_verified_at');
    table.string('password_reset_token', 255);
    table.timestamp('password_reset_expires');
    table.timestamp('last_login');
    table.string('profile_picture_url', 500);
    table.jsonb('preferences').defaultTo('{}');
    table.string('timezone', 50).defaultTo('UTC');
    table.string('language', 10).defaultTo('en');
    table.boolean('mfa_enabled').defaultTo(false);
    table.string('mfa_secret', 255);
    table.jsonb('mfa_backup_codes');
    table.timestamp('mfa_enabled_at');
    table.timestamps(true, true);
    table.unique(['tenant_id', 'email']);
  });

  await knex.schema.createTable('roles', table => {
    table.increments('id').primary();
    table.integer('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.text('description');
    table.specificType('space', 'role_space').notNullable();
    table.specificType('status', 'user_status').defaultTo('active');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('modules', table => {
    table.increments('id').primary();
    table.string('menu_key', 100).notNullable().unique();
    table.string('display_name', 100).notNullable();
    table.text('description');
    table.string('icon', 100);
    table.string('route_path', 255);
    table.string('parent_menu_key', 100);
    table.integer('menu_order').defaultTo(0);
    table.specificType('space', 'role_space').notNullable();
    table.specificType('status', 'user_status').defaultTo('active');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('payment_method_types', table => {
    table.increments('id').primary();
    table.string('name', 100).notNullable().unique();
    table.string('display_name', 255).notNullable();
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('permissions', table => {
    table.increments('id').primary();
    table.string('permission_key', 255).notNullable().unique();
    table.string('resource', 100).notNullable();
    table.string('action', 100).notNullable();
    table.text('description');
    table.string('space', 20).notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('user_roles', table => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('role_id').references('id').inTable('roles').onDelete('CASCADE');
    table.timestamps(true, true);
    table.unique(['user_id', 'role_id']);
  });

  await knex.schema.createTable('role_permissions', table => {
    table.increments('id').primary();
    table.integer('role_id').references('id').inTable('roles').onDelete('CASCADE');
    table.integer('permission_id').references('id').inTable('permissions').onDelete('CASCADE');
    table.timestamps(true, true);
    table.unique(['role_id', 'permission_id']);
  });

  await knex.schema.createTable('audit_logs', table => {
    table.increments('id').primary();
    table.integer('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 100).notNullable();
    table.string('resource_type', 100).notNullable();
    table.integer('resource_id');
    table.jsonb('old_values').defaultTo('{}');
    table.jsonb('new_values').defaultTo('{}');
    table.string('ip_address', 45);
    table.string('user_agent', 500);
    table.specificType('status', 'audit_status').defaultTo('success');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('user_sessions', table => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 255).notNullable();
    table.string('refresh_token_hash', 255);
    table.timestamp('expires_at').notNullable();
    table.timestamp('refresh_expires_at');
    table.string('ip_address', 45);
    table.string('user_agent', 500);
    table.specificType('status', 'session_status').defaultTo('active');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('system_logs', table => {
    table.increments('id').primary();
    table.timestamp('timestamp').defaultTo(knex.fn.now()).notNullable();
    table.specificType('level', 'log_level').defaultTo('info').notNullable();
    table.string('category', 50).notNullable();
    table.text('message').notNullable();
    table.text('stack_trace');
    table.string('request_id', 100);
    table.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.integer('tenant_id').references('id').inTable('tenants').onDelete('SET NULL');
    table.string('ip_address', 45);
    table.text('user_agent');
    table.jsonb('metadata').defaultTo('{}');
    table.integer('response_time_ms');
    table.integer('status_code');
    table.string('method', 10);
    table.text('endpoint');
    table.timestamps(true, true);
    table.index(['timestamp'], 'idx_system_logs_timestamp');
    table.index(['level'], 'idx_system_logs_level');
    table.index(['category'], 'idx_system_logs_category');
    table.index(['user_id'], 'idx_system_logs_user');
    table.index(['tenant_id'], 'idx_system_logs_tenant');
    table.index(['timestamp', 'level'], 'idx_system_logs_timestamp_level');
  });

  await knex.schema.createTable('addresses', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('addressable_type', 50).notNullable();
    table.integer('addressable_id').notNullable();
    table.enum('address_type', ['home', 'work', 'billing', 'shipping', 'business', 'other']).defaultTo('home');
    table.string('label', 100);
    table.boolean('is_primary').defaultTo(false);
    table.string('unit_number', 50);
    table.string('house_number', 50);
    table.string('street_name', 200);
    table.string('subdivision', 200);
    table.string('barangay', 200).notNullable();
    table.string('city_municipality', 200).notNullable();
    table.string('province', 200).notNullable();
    table.enum('region', [
      'NCR', 'CAR', 'Region_I', 'Region_II', 'Region_III',
      'Region_IV_A', 'Region_IV_B', 'Region_V', 'Region_VI',
      'Region_VII', 'Region_VIII', 'Region_IX', 'Region_X',
      'Region_XI', 'Region_XII', 'Region_XIII', 'BARMM'
    ]).notNullable();
    table.string('zip_code', 10);
    table.string('country', 100).defaultTo('Philippines');
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    table.string('landmark', 255);
    table.text('delivery_instructions');
    table.string('contact_person', 200);
    table.string('contact_phone', 50);
    table.boolean('is_verified').defaultTo(false);
    table.timestamp('verified_at');
    table.integer('verified_by').references('id').inTable('users').onDelete('SET NULL');
    table.enum('status', ['active', 'inactive', 'deleted']).defaultTo('active');
    table.integer('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.integer('updated_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    table.index(['tenant_id', 'addressable_type', 'addressable_id'], 'idx_addresses_polymorphic');
    table.index(['tenant_id', 'is_primary'], 'idx_addresses_primary');
    table.index(['tenant_id', 'address_type'], 'idx_addresses_type');
    table.index(['barangay'], 'idx_addresses_barangay');
    table.index(['city_municipality'], 'idx_addresses_city');
    table.index(['province'], 'idx_addresses_province');
    table.index(['region'], 'idx_addresses_region');
    table.index(['status'], 'idx_addresses_status');
  });

  await knex.schema.createTable('customers', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('customer_code', 50).notNullable();
    table.string('customer_type', 20).defaultTo('individual');
    table.string('first_name', 100).notNullable();
    table.string('middle_name', 100);
    table.string('last_name', 100).notNullable();
    table.string('suffix', 20);
    table.date('date_of_birth');
    table.enum('gender', ['male', 'female', 'other']);
    table.string('nationality', 100);
    table.enum('civil_status', ['single', 'married', 'widowed', 'separated', 'divorced']);
    table.string('email', 255);
    table.string('phone', 50).notNullable();
    table.string('alternate_phone', 50);
    table.string('id_type', 50);
    table.string('id_number', 100);
    table.date('id_expiry_date');
    table.string('tin_number', 50);
    table.string('sss_number', 50);
    table.string('employment_status', 50);
    table.string('employer_name', 200);
    table.string('employer_address', 500);
    table.string('employer_phone', 50);
    table.string('occupation', 100);
    table.decimal('monthly_income', 15, 2);
    table.string('source_of_income', 100);
    table.integer('years_employed');
    table.string('business_name', 200);
    table.string('business_type', 100);
    table.string('business_registration_number', 100);
    table.decimal('annual_revenue', 15, 2);
    table.enum('status', ['active', 'inactive', 'suspended', 'blacklisted', 'deceased']).defaultTo('active');
    table.text('status_reason');
    table.string('emergency_contact_name', 200);
    table.string('emergency_contact_relationship', 50);
    table.string('emergency_contact_phone', 50);
    table.string('preferred_language', 10).defaultTo('en');
    table.string('preferred_contact_method', 20).defaultTo('sms');
    table.jsonb('metadata').defaultTo('{}');
    table.text('notes');
    table.integer('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.integer('updated_by').references('id').inTable('users').onDelete('SET NULL');
    table.jsonb('platform_tags').defaultTo(knex.raw("'[]'::jsonb"));
    table.timestamps(true, true);
    table.unique(['tenant_id', 'customer_code']);
    table.unique(['tenant_id', 'email']);
    table.index(['tenant_id', 'status']);
    table.index(['tenant_id', 'phone']);
  });

  await knex.schema.createTable('subscription_plans', table => {
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
    table.specificType('platform_type', 'platform_type');
    table.integer('trial_days').defaultTo(0);
    table.boolean('is_featured').defaultTo(false);
    table.boolean('custom_pricing').defaultTo(false);
    table.integer('sort_order').defaultTo(0);
    table.timestamps(true, true);
    table.unique(['name'], 'subscription_plans_name_unique');
    table.index(['platform_type']);
  });

  await knex.schema.createTable('plan_features', table => {
    table.increments('id').primary();
    table.integer('plan_id').references('id').inTable('subscription_plans').onDelete('CASCADE');
    table.string('feature_key', 100).notNullable();
    table.string('feature_name', 255).notNullable();
    table.text('description');
    table.string('feature_value', 255).defaultTo('true');
    table.boolean('is_enabled').defaultTo(true);
    table.integer('limit_value');
    table.timestamps(true, true);
    table.unique(['plan_id', 'feature_key'], 'plan_features_plan_feature_unique');
  });

  await knex.schema.createTable('tenant_subscriptions', table => {
    table.increments('id').primary();
    table.integer('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('plan_id').references('id').inTable('subscription_plans').onDelete('RESTRICT');
    table.string('status', 50).defaultTo('active');
    table.decimal('monthly_price', 10, 2).notNullable();
    table.decimal('price', 10, 2).defaultTo(0.00);
    table.string('billing_cycle', 20).defaultTo('monthly');
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at');
    table.timestamp('next_billing_date');
    table.timestamp('cancelled_at');
    table.string('cancellation_reason', 500);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('platform_subscriptions', table => {
    table.increments('id').primary();
    table.integer('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.specificType('platform_type', 'platform_type').notNullable();
    table.integer('subscription_plan_id').references('id').inTable('subscription_plans').onDelete('SET NULL');
    table.string('status', 50).defaultTo('active');
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at');
    table.decimal('price', 10, 2).defaultTo(0.00);
    table.specificType('billing_cycle', 'billing_cycle_type').defaultTo('monthly');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
    table.unique(['tenant_id', 'platform_type'], 'platform_subscriptions_tenant_id_platform_type_unique');
  });

  await knex.schema.createTable('invoices', table => {
    table.increments('id').primary();
    table.integer('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('subscription_id').references('id').inTable('tenant_subscriptions').onDelete('SET NULL');
    table.string('invoice_number', 50).notNullable().unique();
    table.string('status', 50).defaultTo('draft');
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

  await knex.schema.createTable('payment_methods', table => {
    table.increments('id').primary();
    table.integer('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.string('type', 50).notNullable();
    table.string('provider', 50).notNullable();
    table.string('external_id', 255);
    table.string('last_four', 4);
    table.string('brand', 50);
    table.integer('exp_month');
    table.integer('exp_year');
    table.boolean('is_default').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('payment_history', table => {
    table.increments('id').primary();
    table.integer('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('invoice_id').references('id').inTable('invoices').onDelete('SET NULL');
    table.integer('payment_method_id').references('id').inTable('payment_methods').onDelete('SET NULL');
    table.string('transaction_id', 255).unique();
    table.string('external_transaction_id', 255);
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.string('status', 50).defaultTo('pending');
    table.string('provider', 50).notNullable();
    table.text('failure_reason');
    table.timestamp('processed_at');
    table.jsonb('provider_response').defaultTo('{}');
    table.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.integer('subscription_plan_id').references('id').inTable('subscription_plans').onDelete('SET NULL');
    table.string('transaction_type', 50);
    table.string('plan_name', 100);
    table.string('platform_type', 50);
    table.text('description');
    table.timestamps(true, true);
    table.index(['tenant_id'], 'idx_payment_history_tenant');
    table.index(['status'], 'idx_payment_history_status');
    table.index(['user_id'], 'idx_payment_history_user');
    table.index(['subscription_plan_id'], 'idx_payment_history_plan');
    table.index(['transaction_type'], 'idx_payment_history_transaction_type');
    table.index(['platform_type'], 'idx_payment_history_platform_type');
  });

  await knex.schema.createTable('webhook_events', table => {
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

  await knex.schema.createTable('employee_profiles', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('employee_code', 50).notNullable();
    table.string('employee_id_number', 100);
    table.string('position', 100).notNullable();
    table.string('department', 100);
    table.specificType('employment_type', 'employment_type').defaultTo('full-time');
    table.specificType('employment_status', 'employment_status').defaultTo('active');
    table.date('hire_date').notNullable();
    table.date('probation_end_date');
    table.date('regularization_date');
    table.date('resignation_date');
    table.date('termination_date');
    table.integer('reports_to');
    table.integer('supervisor_id').references('id').inTable('users');
    table.string('cost_center', 100);
    table.integer('branch_id');
    table.decimal('basic_salary', 15, 2);
    table.string('pay_grade', 20);
    table.string('bank_name', 100);
    table.string('bank_account_number', 255);
    table.string('bank_account_name', 255);
    table.decimal('performance_rating', 3, 2);
    table.date('last_review_date');
    table.date('next_review_date');
    table.decimal('sales_target', 15, 2);
    table.decimal('collection_target', 15, 2);
    table.string('status', 20).defaultTo('active');
    // Contact Information fields
    table.string('work_phone', 50);
    table.string('work_email', 255);
    table.string('phone_extension', 20);
    table.string('emergency_contact_name', 255);
    table.string('emergency_contact_phone', 50);
    table.text('notes');
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    table.unique(['tenant_id', 'employee_code']);
    table.unique(['tenant_id', 'user_id']);
  });

  await knex.schema.createTable('employee_product_access', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('employee_id').notNullable().references('id').inTable('employee_profiles').onDelete('CASCADE');
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.specificType('platform_type', 'platform_type').notNullable();
    table.specificType('access_level', 'access_level').defaultTo('view');
    table.boolean('is_primary').defaultTo(false);
    table.boolean('can_approve_loans').defaultTo(false);
    table.decimal('max_approval_amount', 15, 2);
    table.boolean('can_disburse_funds').defaultTo(false);
    table.boolean('can_view_reports').defaultTo(false);
    table.boolean('can_modify_interest').defaultTo(false);
    table.boolean('can_waive_penalties').defaultTo(false);
    table.decimal('daily_transaction_limit', 15, 2);
    table.decimal('monthly_transaction_limit', 15, 2);
    table.integer('max_daily_transactions');
    table.integer('assigned_by').references('id').inTable('users');
    table.timestamp('assigned_date').defaultTo(knex.fn.now());
    table.text('assignment_notes');
    table.integer('revoked_by').references('id').inTable('users');
    table.timestamp('revoked_date');
    table.text('revocation_reason');
    table.specificType('status', 'product_access_status').defaultTo('active');
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    table.unique(['employee_id', 'platform_type']);
  });

  await knex.schema.createTable('money_loan_products', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('product_code', 50).notNullable();
    table.string('name', 100).notNullable();
    table.text('description');
    table.decimal('min_amount', 15, 2).notNullable();
    table.decimal('max_amount', 15, 2).notNullable();
    table.decimal('interest_rate', 5, 2).notNullable();
    table.enum('interest_type', ['flat', 'reducing', 'compound']).defaultTo('reducing');
    table.enum('loan_term_type', ['fixed', 'flexible']).defaultTo('flexible');
    table.integer('fixed_term_days');
    table.integer('min_term_days');
    table.integer('max_term_days');
    table.decimal('processing_fee_percent', 5, 2).defaultTo(0);
    table.decimal('platform_fee', 15, 2).defaultTo(50);
    table.decimal('late_payment_penalty_percent', 5, 2).defaultTo(0);
    table.integer('grace_period_days').defaultTo(0);
    table.enum('payment_frequency', ['daily', 'weekly', 'monthly']).defaultTo('weekly');
    table.boolean('is_active').defaultTo(true);
    table.jsonb('required_documents');
    table.jsonb('eligibility_criteria');
    table.jsonb('metadata');
    table.timestamps(true, true);
    table.unique(['tenant_id', 'product_code']);
  });

  await knex.schema.createTable('money_loan_applications', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('application_number', 50).notNullable();
    table.integer('customer_id').notNullable().references('id').inTable('customers').onDelete('RESTRICT');
    table.integer('loan_product_id').notNullable().references('id').inTable('money_loan_products').onDelete('RESTRICT');
    table.decimal('requested_amount', 15, 2).notNullable();
    table.integer('requested_term_days').notNullable();
    table.string('purpose', 200);
    table.enum('status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled', 'disbursed']).defaultTo('draft');
    table.integer('reviewed_by').references('id').inTable('users').onDelete('SET NULL');
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
  });

  await knex.schema.createTable('money_loan_loans', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('loan_number', 50).notNullable();
    table.integer('customer_id').notNullable().references('id').inTable('customers').onDelete('RESTRICT');
    table.integer('loan_product_id').notNullable().references('id').inTable('money_loan_products').onDelete('RESTRICT');
    table.integer('application_id').references('id').inTable('money_loan_applications').onDelete('SET NULL');
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
    table.enum('status', ['pending', 'disbursed', 'active', 'overdue', 'defaulted', 'paid_off', 'cancelled']).defaultTo('pending');
    table.integer('days_overdue').defaultTo(0);
    table.integer('approved_by').references('id').inTable('users').onDelete('SET NULL');
    table.integer('disbursed_by').references('id').inTable('users').onDelete('SET NULL');
    table.string('disbursement_method', 50);
    table.string('disbursement_reference', 100);
    table.text('disbursement_notes');
    table.jsonb('metadata');
    table.timestamps(true, true);
    table.unique(['tenant_id', 'loan_number']);
    table.index(['tenant_id', 'customer_id']);
    table.index(['tenant_id', 'status']);
    table.index(['disbursement_date']);
    table.index(['maturity_date']);
  });

  await knex.schema.createTable('money_loan_repayment_schedules', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('loan_id').notNullable().references('id').inTable('money_loan_loans').onDelete('CASCADE');
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
  });

  await knex.schema.createTable('money_loan_payments', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('payment_reference', 100).notNullable();
    table.integer('loan_id').notNullable().references('id').inTable('money_loan_loans').onDelete('RESTRICT');
    table.integer('customer_id').notNullable().references('id').inTable('customers').onDelete('RESTRICT');
    table.decimal('amount', 15, 2).notNullable();
    table.decimal('principal_amount', 15, 2).notNullable();
    table.decimal('interest_amount', 15, 2).notNullable();
    table.decimal('penalty_amount', 15, 2).defaultTo(0);
    table.enum('payment_method', ['cash', 'bank_transfer', 'check', 'online', 'mobile_money', 'other']).notNullable();
    table.string('transaction_id', 100);
    table.date('payment_date').notNullable();
    table.enum('status', ['pending', 'completed', 'failed', 'refunded']).defaultTo('completed');
    table.integer('received_by').references('id').inTable('users').onDelete('SET NULL');
    table.text('notes');
    table.jsonb('metadata');
    table.timestamps(true, true);
    table.unique(['tenant_id', 'payment_reference']);
    table.index(['tenant_id', 'loan_id']);
    table.index(['tenant_id', 'customer_id']);
    table.index(['payment_date']);
    table.index(['status']);
  });

  await knex.schema.createTable('money_loan_documents', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('customer_id').notNullable().references('id').inTable('customers').onDelete('CASCADE');
    table.integer('loan_id').references('id').inTable('money_loan_loans').onDelete('CASCADE');
    table.integer('application_id').references('id').inTable('money_loan_applications').onDelete('CASCADE');
    table.string('document_type', 100).notNullable();
    table.string('document_name', 255).notNullable();
    table.string('file_path', 500).notNullable();
    table.string('file_type', 50);
    table.integer('file_size');
    table.enum('status', ['pending', 'verified', 'rejected']).defaultTo('pending');
    table.integer('verified_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('verified_at');
    table.text('notes');
    table.timestamps(true, true);
    table.index(['tenant_id', 'customer_id']);
    table.index(['loan_id']);
    table.index(['application_id']);
  });

  await knex.schema.createTable('money_loan_collection_activities', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('loan_id').notNullable().references('id').inTable('money_loan_loans').onDelete('CASCADE');
    table.integer('customer_id').notNullable().references('id').inTable('customers').onDelete('RESTRICT');
    table.enum('activity_type', ['call', 'sms', 'email', 'visit', 'legal_notice', 'other']).notNullable();
    table.date('activity_date').notNullable();
    table.text('notes');
    table.enum('outcome', ['contacted', 'promised_payment', 'payment_made', 'no_response', 'refused', 'other']);
    table.date('promised_payment_date');
    table.integer('performed_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
    table.index(['tenant_id', 'loan_id']);
    table.index(['activity_date']);
  });

  await knex.schema.createTable('money_loan_interest_rates', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('loan_product_id').notNullable().references('id').inTable('money_loan_products').onDelete('CASCADE');
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
  });

  await knex.schema.createTable('money_loan_payment_schedules', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('loan_product_id').notNullable().references('id').inTable('money_loan_products').onDelete('CASCADE');
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
  });

  await knex.schema.createTable('money_loan_fees', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('loan_product_id').notNullable().references('id').inTable('money_loan_products').onDelete('CASCADE');
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
  });

  await knex.schema.createTable('money_loan_approval_rules', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('loan_product_id').notNullable().references('id').inTable('money_loan_products').onDelete('CASCADE');
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
  });

  await knex.schema.createTable('money_loan_modifications', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('loan_id').notNullable().references('id').inTable('money_loan_loans').onDelete('RESTRICT');
    table.string('modification_number', 50).notNullable();
    table.enum('modification_type', ['term_extension', 'payment_adjustment', 'interest_rate_change', 'restructuring', 'consolidation', 'refinance', 'partial_prepayment', 'grace_period', 'payment_holiday', 'other']).notNullable();
    table.enum('status', ['requested', 'approved', 'rejected', 'pending_review', 'implemented', 'cancelled']).defaultTo('requested');
    table.enum('requested_by', ['customer', 'employee', 'system', 'manager']).notNullable();
    table.integer('requested_by_user_id').references('id').inTable('users').onDelete('SET NULL');
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
    table.integer('approved_by_user_id').references('id').inTable('users').onDelete('SET NULL');
    table.date('approved_date');
    table.text('approval_notes');
    table.text('rejection_reason');
    table.integer('rejected_by_user_id').references('id').inTable('users').onDelete('SET NULL');
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

  await knex.schema.createTable('money_loan_customer_profiles', table => {
    table.increments('id').primary();
    table.integer('customer_id').notNullable().references('id').inTable('customers').onDelete('CASCADE');
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('credit_score').defaultTo(650);
    table.enum('risk_level', ['low', 'medium', 'high']).defaultTo('medium');
    table.decimal('total_debt', 15, 2).defaultTo(0);
    table.boolean('has_existing_loans').defaultTo(false);
    table.enum('kyc_status', ['pending', 'verified', 'rejected', 'expired']).defaultTo('pending');
    table.timestamp('kyc_verified_at');
    table.integer('kyc_verified_by').references('id').inTable('users').onDelete('SET NULL');
    table.text('kyc_notes');
    table.date('kyc_expiry_date');
    table.string('reference_name', 200);
    table.string('reference_phone', 50);
    table.string('reference_relationship', 50);
    table.string('reference_address', 500);
    table.string('reference2_name', 200);
    table.string('reference2_phone', 50);
    table.string('reference2_relationship', 50);
    table.string('reference2_address', 500);
    table.integer('preferred_loan_term');
    table.decimal('max_loan_amount', 15, 2);
    table.decimal('current_loan_limit', 15, 2);
    table.integer('total_loans_count').defaultTo(0);
    table.decimal('total_amount_borrowed', 15, 2).defaultTo(0);
    table.decimal('total_amount_paid', 15, 2).defaultTo(0);
    table.decimal('outstanding_balance', 15, 2).defaultTo(0);
    table.integer('active_loans_count').defaultTo(0);
    table.integer('completed_loans_count').defaultTo(0);
    table.integer('defaulted_loans_count').defaultTo(0);
    table.decimal('on_time_payment_rate', 5, 2).defaultTo(100);
    table.integer('late_payment_count').defaultTo(0);
    table.integer('days_past_due_max').defaultTo(0);
    table.date('last_loan_date');
    table.date('last_payment_date');
    table.boolean('auto_debit_enabled').defaultTo(false);
    table.string('preferred_payment_method', 50);
    table.integer('preferred_payment_day');
    table.enum('status', ['active', 'suspended', 'blocked', 'inactive']).defaultTo('active');
    table.text('notes');
    table.text('internal_notes');
    table.timestamp('enrolled_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['customer_id', 'tenant_id'], 'unique_moneyloan_customer_tenant');
    table.index(['tenant_id']);
    table.index(['status']);
    table.index(['kyc_status']);
    table.index(['credit_score']);
  });

  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_roles_space ON roles(space)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_permissions_space ON permissions(space)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_subscription_plans_featured ON subscription_plans(is_featured) WHERE is_featured = true');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort ON subscription_plans(sort_order)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_plan_features_plan ON plan_features(plan_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_plan_features_key ON plan_features(feature_key)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_platform_subscriptions_tenant ON platform_subscriptions(tenant_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_platform_subscriptions_status ON platform_subscriptions(status)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_customers_platform_tags ON customers USING GIN (platform_tags)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_profiles_tenant ON employee_profiles(tenant_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_profiles_user ON employee_profiles(user_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_profiles_employee_code ON employee_profiles(tenant_id, employee_code)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_profiles_supervisor ON employee_profiles(supervisor_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_profiles_status ON employee_profiles(employment_status)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_profiles_department ON employee_profiles(tenant_id, department)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_product_access_tenant ON employee_product_access(tenant_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_product_access_employee ON employee_product_access(employee_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_product_access_user ON employee_product_access(user_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_product_access_product ON employee_product_access(platform_type)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_product_access_status ON employee_product_access(status)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_product_access_primary ON employee_product_access(employee_id, is_primary) WHERE is_primary = true');

  await knex.schema.raw(`
    CREATE OR REPLACE FUNCTION validate_permission_space()
    RETURNS TRIGGER AS $$
    DECLARE
      role_space VARCHAR(20);
      perm_space VARCHAR(20);
    BEGIN
      SELECT space INTO role_space FROM roles WHERE id = NEW.role_id;
      SELECT space INTO perm_space FROM permissions WHERE id = NEW.permission_id;
      IF role_space != perm_space THEN
        RAISE EXCEPTION 'Permission space mismatch: % role cannot take % permission', role_space, perm_space;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.schema.raw(`
    DROP TRIGGER IF EXISTS trigger_validate_permission_space ON role_permissions;
    CREATE TRIGGER trigger_validate_permission_space
    BEFORE INSERT OR UPDATE ON role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION validate_permission_space();
  `);

  const paymentMethodTypes = [
    { name: 'stripe', display_name: 'Stripe', description: 'Credit/Debit Card via Stripe', is_active: true },
    { name: 'paypal', display_name: 'PayPal', description: 'PayPal Account', is_active: true },
    { name: 'gcash', display_name: 'GCash', description: 'GCash Mobile Wallet', is_active: true },
    { name: 'bank_transfer', display_name: 'Bank Transfer', description: 'Direct Bank Transfer', is_active: true },
    { name: 'manual', display_name: 'Manual Payment', description: 'Offline/Manual Payment Entry', is_active: true }
  ];

  await knex('payment_method_types').insert(paymentMethodTypes);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  await knex.schema.raw('DROP TRIGGER IF EXISTS trigger_validate_permission_space ON role_permissions');
  await knex.schema.raw('DROP FUNCTION IF EXISTS validate_permission_space');

  const tables = [
    'money_loan_modifications',
    'money_loan_approval_rules',
    'money_loan_fees',
    'money_loan_payment_schedules',
    'money_loan_interest_rates',
    'money_loan_collection_activities',
    'money_loan_documents',
    'money_loan_payments',
    'money_loan_repayment_schedules',
    'money_loan_loans',
    'money_loan_applications',
    'money_loan_products',
    'money_loan_customer_profiles',
    'employee_product_access',
    'employee_profiles',
    'payment_history',
    'payment_methods',
    'webhook_events',
    'invoices',
    'platform_subscriptions',
    'tenant_subscriptions',
    'plan_features',
    'subscription_plans',
    'customers',
    'addresses',
    'system_logs',
    'user_sessions',
    'audit_logs',
    'role_permissions',
    'user_roles',
    'permissions',
    'modules',
    'payment_method_types',
    'roles',
    'users',
    'tenants'
  ];

  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }

  const types = [
    'audit_action',
    'log_level',
    'product_access_status',
    'access_level',
    'employment_status',
    'employment_type',
    'plan_status',
    'billing_cycle_type',
    'platform_type',
    'tenant_plan',
    'permission_status',
    'audit_status',
    'session_status',
    'tenant_status',
    'role_space',
    'user_status'
  ];

  for (const type of types) {
    await knex.raw(`DROP TYPE IF EXISTS ${type} CASCADE`);
  }
};
