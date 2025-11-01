/**
 * Migration: Create system_logs and audit_logs tables
 * For comprehensive system monitoring and compliance
 */

exports.up = async function(knex) {
  // Create log_level enum
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE log_level AS ENUM ('debug', 'info', 'warning', 'error', 'critical');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create audit_action enum
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE audit_action AS ENUM ('login', 'logout', 'create', 'update', 'delete', 'view', 'export', 'import', 'approve', 'reject');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create system_logs table (only if it doesn't exist)
  const systemLogsExists = await knex.schema.hasTable('system_logs');
  if (!systemLogsExists) {
    await knex.schema.createTable('system_logs', function(table) {
      table.increments('id').primary();
      table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
      table.specificType('level', 'log_level').notNullable().defaultTo('info');
      table.string('category', 50).notNullable(); // api, database, auth, payment, email, etc.
      table.text('message').notNullable();
      table.text('stack_trace');
      table.string('request_id', 100);
      table.integer('user_id').unsigned().nullable()
        .references('id').inTable('users').onDelete('SET NULL');
      table.integer('tenant_id').unsigned().nullable()
        .references('id').inTable('tenants').onDelete('SET NULL');
      table.string('ip_address', 45);
      table.text('user_agent');
      table.jsonb('metadata').defaultTo('{}');
      table.integer('response_time_ms');
      table.integer('status_code');
      table.string('method', 10); // GET, POST, etc.
      table.text('endpoint');
      table.timestamps(true, true);

      // Indexes for common queries
      table.index('timestamp', 'idx_system_logs_timestamp');
      table.index('level', 'idx_system_logs_level');
      table.index('category', 'idx_system_logs_category');
      table.index('user_id', 'idx_system_logs_user');
      table.index('tenant_id', 'idx_system_logs_tenant');
      table.index(['timestamp', 'level'], 'idx_system_logs_timestamp_level');
    });
    // eslint-disable-next-line no-console
    console.log('✓ Created system_logs table');
  } else {
    // eslint-disable-next-line no-console
    console.log('○ system_logs table already exists');
  }

  // Create audit_logs table (only if it doesn't exist)
  const auditLogsExists = await knex.schema.hasTable('audit_logs');
  if (!auditLogsExists) {
    await knex.schema.createTable('audit_logs', function(table) {
      table.increments('id').primary();
      table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
      table.integer('user_id').unsigned().nullable()
        .references('id').inTable('users').onDelete('SET NULL');
      table.integer('tenant_id').unsigned().nullable()
        .references('id').inTable('tenants').onDelete('SET NULL');
      table.specificType('action', 'audit_action').notNullable();
      table.string('resource_type', 50).notNullable(); // user, tenant, subscription, invoice, etc.
      table.string('resource_id', 100);
      table.jsonb('old_values').defaultTo('{}');
      table.jsonb('new_values').defaultTo('{}');
      table.string('ip_address', 45);
      table.text('user_agent');
      table.text('description');
      table.string('request_id', 100);
      table.jsonb('metadata').defaultTo('{}');
      table.timestamps(true, true);

      // Indexes for common queries
      table.index('timestamp', 'idx_audit_logs_timestamp');
      table.index('user_id', 'idx_audit_logs_user');
      table.index('tenant_id', 'idx_audit_logs_tenant');
      table.index('action', 'idx_audit_logs_action');
      table.index('resource_type', 'idx_audit_logs_resource_type');
      table.index(['resource_type', 'resource_id'], 'idx_audit_logs_resource');
      table.index(['timestamp', 'action'], 'idx_audit_logs_timestamp_action');
    });
    // eslint-disable-next-line no-console
    console.log('✓ Created audit_logs table');
  } else {
    // eslint-disable-next-line no-console
    console.log('○ audit_logs table already exists');
  }
};

exports.down = async function(knex) {
  // Drop tables
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('system_logs');

  // Drop enums
  await knex.raw('DROP TYPE IF EXISTS audit_action');
  await knex.raw('DROP TYPE IF EXISTS log_level');

  // eslint-disable-next-line no-console
  console.log('✓ Dropped system_logs and audit_logs tables');
};
