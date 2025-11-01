/**
 * Migration: Add loan_term_type, fixed_term_days, and payment_frequency columns
 * Date: 2025-10-30
 */

exports.up = function(knex) {
  return knex.schema.table('money_loan_products', function(table) {
    // Add loan_term_type column (fixed or flexible)
    table.enum('loan_term_type', ['fixed', 'flexible']).defaultTo('flexible').after('interest_type');
    
    // Add fixed_term_days column (nullable, only used when loan_term_type is 'fixed')
    table.integer('fixed_term_days').nullable().after('loan_term_type');
    
    // Make min_term_days and max_term_days nullable (only used when loan_term_type is 'flexible')
    table.integer('min_term_days').nullable().alter();
    table.integer('max_term_days').nullable().alter();
    
    // Add payment_frequency column
    table.enum('payment_frequency', ['daily', 'weekly', 'monthly']).defaultTo('weekly').after('grace_period_days');
  });
};

exports.down = function(knex) {
  return knex.schema.table('money_loan_products', function(table) {
    // Remove new columns
    table.dropColumn('payment_frequency');
    table.dropColumn('fixed_term_days');
    table.dropColumn('loan_term_type');
    
    // Restore NOT NULL constraints on term days
    table.integer('min_term_days').notNullable().alter();
    table.integer('max_term_days').notNullable().alter();
  });
};
