exports.up = async function(knex) {
  console.log('Creating money_loan_collector_targets table...');

  await knex.schema.createTable('money_loan_collector_targets', table => {
    table.increments('id').primary();
    table.integer('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('collector_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    
    // Target configuration
    table.string('target_type', 50).notNullable(); // 'collections', 'disbursements', 'approvals', 'visits'
    table.string('period', 20).notNullable(); // 'daily', 'weekly', 'monthly', 'quarterly'
    table.date('period_start').notNullable();
    table.date('period_end').notNullable();
    
    // Targets
    table.decimal('target_amount', 15, 2).defaultTo(0);
    table.integer('target_count').defaultTo(0);
    
    // Actuals (updated periodically)
    table.decimal('actual_amount', 15, 2).defaultTo(0);
    table.integer('actual_count').defaultTo(0);
    
    // Achievement
    table.decimal('achievement_percentage', 5, 2).defaultTo(0);
    table.string('status', 20).defaultTo('active'); // 'active', 'completed', 'cancelled'
    
    // Notes
    table.text('notes');
    
    table.timestamps(true, true);
    
    // Unique constraint to prevent duplicate targets
    table.unique(['tenant_id', 'collector_id', 'target_type', 'period_start']);
  });

  await knex.schema.raw('CREATE INDEX idx_money_loan_collector_targets_tenant_collector ON money_loan_collector_targets(tenant_id, collector_id)');
  await knex.schema.raw('CREATE INDEX idx_money_loan_collector_targets_period ON money_loan_collector_targets(period_start, period_end)');
  await knex.schema.raw('CREATE INDEX idx_money_loan_collector_targets_type ON money_loan_collector_targets(target_type)');
  await knex.schema.raw('CREATE INDEX idx_money_loan_collector_targets_status ON money_loan_collector_targets(status)');

  console.log('✓ Created money_loan_collector_targets table');
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('money_loan_collector_targets');
  console.log('✓ Dropped money_loan_collector_targets table');
};
