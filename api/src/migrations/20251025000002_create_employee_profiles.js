/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Create employment_type enum
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE employment_type AS ENUM ('full-time', 'part-time', 'contract', 'probation', 'intern');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create employment_status enum
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE employment_status AS ENUM ('active', 'on_leave', 'suspended', 'resigned', 'terminated');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create employee_profiles table
  await knex.schema.createTable('employee_profiles', function (table) {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable()
      .references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('user_id').notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    
    // Core Employee Identity
    table.string('employee_code', 50).notNullable(); // EMP-001, EMP-002, etc.
    table.string('employee_id_number', 100); // Government ID or company badge number
    table.string('position', 100).notNullable();
    table.string('department', 100);
    table.specificType('employment_type', 'employment_type').defaultTo('full-time');
    table.specificType('employment_status', 'employment_status').defaultTo('active');
    
    // Employment Dates
    table.date('hire_date').notNullable();
    table.date('probation_end_date');
    table.date('regularization_date');
    table.date('resignation_date');
    table.date('termination_date');
    
    // Organizational Hierarchy
    table.integer('reports_to'); // employee_profiles.id of supervisor
    table.integer('supervisor_id').references('id').inTable('users'); // user_id of supervisor
    table.string('cost_center', 100);
    table.integer('branch_id'); // Future: references branches table
    
    // Compensation (encrypted sensitive data)
    table.decimal('basic_salary', 15, 2);
    table.string('pay_grade', 20);
    table.string('bank_name', 100);
    table.string('bank_account_number', 255); // Should be encrypted in application
    table.string('bank_account_name', 255);
    
    // Performance Tracking
    table.decimal('performance_rating', 3, 2); // e.g., 4.50 out of 5.00
    table.date('last_review_date');
    table.date('next_review_date');
    table.decimal('sales_target', 15, 2); // Monthly/Quarterly sales target
    table.decimal('collection_target', 15, 2); // Collection target for loan officers
    
    // Status & Notes
    table.string('status', 20).defaultTo('active'); // active, inactive, suspended
    table.text('notes'); // General notes about the employee
    
    // Audit Trail
    table.timestamps(true, true);
    table.timestamp('deleted_at'); // Soft delete support
    
    // Constraints
    table.unique(['tenant_id', 'employee_code']); // Unique employee code per tenant
    table.unique(['tenant_id', 'user_id']); // One employee profile per user per tenant
  });

  // Create indexes for better query performance
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_profiles_tenant ON employee_profiles(tenant_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_profiles_user ON employee_profiles(user_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_profiles_employee_code ON employee_profiles(tenant_id, employee_code)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_profiles_supervisor ON employee_profiles(supervisor_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_profiles_status ON employee_profiles(employment_status)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_employee_profiles_department ON employee_profiles(tenant_id, department)');

  console.log('✓ Created employee_profiles table');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('employee_profiles');
  await knex.raw('DROP TYPE IF EXISTS employment_type CASCADE');
  await knex.raw('DROP TYPE IF EXISTS employment_status CASCADE');
  
  console.log('✓ Dropped employee_profiles table');
};
