/**
 * Money Loan Products - Add loan term type and payment frequency
 * Migration to support fixed/flexible term types and payment frequency
 */

exports.up = function(knex) {
  return knex.schema.alterTable('money_loan_products', (table) => {
    // Add loan term type (fixed or flexible)
    table.enum('loan_term_type', ['fixed', 'flexible']).defaultTo('flexible').after('interest_type');
    
    // Add fixed term days (only used when loan_term_type = 'fixed')
    table.integer('fixed_term_days').nullable().after('loan_term_type');
    
    // Make min_term_days and max_term_days nullable (they're only used when loan_term_type = 'flexible')
    table.integer('min_term_days').nullable().alter();
    table.integer('max_term_days').nullable().alter();
    
    // Add payment frequency (daily, weekly, monthly)
    table.enum('payment_frequency', ['daily', 'weekly', 'monthly']).defaultTo('weekly').after('grace_period_days');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('money_loan_products', (table) => {
    // Remove added columns
    table.dropColumn('payment_frequency');
    table.dropColumn('fixed_term_days');
    table.dropColumn('loan_term_type');
    
    // Restore NOT NULL constraints on min_term_days and max_term_days
    table.integer('min_term_days').notNullable().alter();
    table.integer('max_term_days').notNullable().alter();
  });
};
