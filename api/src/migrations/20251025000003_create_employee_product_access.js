/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Create product_type enum (matches tenant product fields)
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE product_type AS ENUM ('money_loan', 'bnpl', 'pawnshop');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create access_level enum
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE access_level AS ENUM ('view', 'create', 'edit', 'approve', 'manage', 'admin');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create product_access_status enum
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE product_access_status AS ENUM ('active', 'suspended', 'revoked');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create employee_product_access table (many-to-many with permissions)
  await knex.schema.createTable('employee_product_access', function (table) {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable()
      .references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('employee_id').notNullable()
      .references('id').inTable('employee_profiles').onDelete('CASCADE');
    table.integer('user_id').notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    
    // Product & Access Control
    table.specificType('product_type', 'product_type').notNullable();
    table.specificType('access_level', 'access_level').defaultTo('view');
    table.boolean('is_primary').defaultTo(false); // Primary product for this employee
    
    // Permissions
    table.boolean('can_approve_loans').defaultTo(false);
    table.decimal('max_approval_amount', 15, 2); // Maximum loan amount they can approve
    table.boolean('can_disburse_funds').defaultTo(false);
    table.boolean('can_view_reports').defaultTo(false);
    table.boolean('can_modify_interest').defaultTo(false);
    table.boolean('can_waive_penalties').defaultTo(false);
    
    // Transaction Limits
    table.decimal('daily_transaction_limit', 15, 2);
    table.decimal('monthly_transaction_limit', 15, 2);
    table.integer('max_daily_transactions'); // Number of transactions per day
    
    // Assignment Details
    table.integer('assigned_by').references('id').inTable('users'); // Who assigned this access
    table.timestamp('assigned_date').defaultTo(knex.fn.now());
    table.text('assignment_notes');
    
    // Revocation Details
    table.integer('revoked_by').references('id').inTable('users');
    table.timestamp('revoked_date');
    table.text('revocation_reason');
    
    // Status
    table.specificType('status', 'product_access_status').defaultTo('active');
    
    // Audit Trail
    table.timestamps(true, true);
    table.timestamp('deleted_at'); // Soft delete support
    
    // Constraints
    table.unique(['employee_id', 'product_type']); // One access record per product per employee
  });

  // Create indexes for better query performance
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_product_access_tenant ON employee_product_access(tenant_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_product_access_employee ON employee_product_access(employee_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_product_access_user ON employee_product_access(user_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_product_access_product ON employee_product_access(product_type)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_product_access_status ON employee_product_access(status)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_product_access_primary ON employee_product_access(employee_id, is_primary) WHERE is_primary = true');

  console.log('✓ Created employee_product_access table');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('employee_product_access');
  await knex.raw('DROP TYPE IF EXISTS product_type CASCADE');
  await knex.raw('DROP TYPE IF EXISTS access_level CASCADE');
  await knex.raw('DROP TYPE IF EXISTS product_access_status CASCADE');
  
  console.log('✓ Dropped employee_product_access table');
};
