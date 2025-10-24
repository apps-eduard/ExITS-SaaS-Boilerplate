/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Create ENUM types using raw SQL with existence check
  const enumTypes = [
    { name: 'user_status', values: ['active', 'suspended', 'deleted'] },
    { name: 'role_space', values: ['system', 'tenant'] },
    { name: 'tenant_status', values: ['active', 'suspended', 'deleted'] },
    { name: 'session_status', values: ['active', 'revoked', 'expired'] },
    { name: 'audit_status', values: ['success', 'failure', 'pending'] },
    { name: 'permission_status', values: ['active', 'conditional', 'revoked'] },
    { name: 'tenant_plan', values: ['starter', 'pro', 'enterprise', 'trial'] }
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

  // Create tenants table
  await knex.schema.createTable('tenants', function (table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('subdomain', 100).unique().notNullable();
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
  });

  // Create users table
  await knex.schema.createTable('users', function (table) {
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
    table.timestamps(true, true);
    
    table.unique(['tenant_id', 'email']);
  });

  // Create roles table
  await knex.schema.createTable('roles', function (table) {
    table.increments('id').primary();
    table.integer('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.text('description');
    table.specificType('space', 'role_space').notNullable();
    table.specificType('status', 'user_status').defaultTo('active');
    table.timestamps(true, true);
  });

  // Create modules table  
  await knex.schema.createTable('modules', function (table) {
    table.increments('id').primary();
    table.string('menu_key', 100).unique().notNullable();
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

  // Create permissions table (Standard RBAC)
  await knex.schema.createTable('permissions', function (table) {
    table.increments('id').primary();
    table.string('permission_key', 255).unique().notNullable();
    table.string('resource', 100).notNullable();
    table.string('action', 100).notNullable();
    table.text('description');
    table.string('space', 20).notNullable(); // Using string instead of enum for simplicity
    table.timestamps(true, true);
  });

  // Create user_roles table
  await knex.schema.createTable('user_roles', function (table) {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('role_id').references('id').inTable('roles').onDelete('CASCADE');
    table.timestamps(true, true);
    
    table.unique(['user_id', 'role_id']);
  });

  // Create role_permissions_standard table
  await knex.schema.createTable('role_permissions_standard', function (table) {
    table.increments('id').primary();
    table.integer('role_id').references('id').inTable('roles').onDelete('CASCADE');
    table.integer('permission_id').references('id').inTable('permissions').onDelete('CASCADE');
    table.timestamps(true, true);
    
    table.unique(['role_id', 'permission_id']);
  });

  // Create audit_logs table
  await knex.schema.createTable('audit_logs', function (table) {
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

  // Create user_sessions table
  await knex.schema.createTable('user_sessions', function (table) {
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

  // Create indexes
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_roles_space ON roles(space)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_permissions_space ON permissions(space)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash)');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Drop tables in reverse order of creation
  await knex.schema.dropTableIfExists('user_sessions');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('role_permissions_standard');
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('modules');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('tenants');
  
  // Drop custom types
  await knex.raw('DROP TYPE IF EXISTS user_status CASCADE');
  await knex.raw('DROP TYPE IF EXISTS role_space CASCADE');
  await knex.raw('DROP TYPE IF EXISTS tenant_status CASCADE');
  await knex.raw('DROP TYPE IF EXISTS session_status CASCADE');
  await knex.raw('DROP TYPE IF EXISTS audit_status CASCADE');
  await knex.raw('DROP TYPE IF EXISTS permission_status CASCADE');
  await knex.raw('DROP TYPE IF EXISTS tenant_plan CASCADE');
};
