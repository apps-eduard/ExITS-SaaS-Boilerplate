/**
 * Migration: Enhance payment_history table for subscription transactions
 * Adds fields needed for transaction history display
 */

exports.up = function(knex) {
  return knex.schema.table('payment_history', function(table) {
    // Add user_id to track who made the payment
    table.integer('user_id').unsigned().nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    
    // Add subscription_plan_id to track which plan was subscribed to
    table.integer('subscription_plan_id').unsigned().nullable()
      .references('id').inTable('subscription_plans').onDelete('SET NULL');
    
    // Add transaction_type to differentiate subscription types
    table.string('transaction_type', 50).nullable(); // 'subscription', 'upgrade', 'downgrade', 'refund', 'payment'
    
    // Add plan_name for historical reference (in case plan is deleted)
    table.string('plan_name', 100).nullable();
    
    // Add product_type for filtering and display
    table.string('product_type', 50).nullable(); // 'platform', 'moneyloan', 'bnpl', 'pawnshop'
    
    // Add description for custom notes
    table.text('description').nullable();
    
    // Add indexes for common queries
    table.index('user_id', 'idx_payment_history_user');
    table.index('subscription_plan_id', 'idx_payment_history_plan');
    table.index('transaction_type', 'idx_payment_history_transaction_type');
    table.index('product_type', 'idx_payment_history_product_type');
  });
};

exports.down = function(knex) {
  return knex.schema.table('payment_history', function(table) {
    // Drop indexes
    table.dropIndex('user_id', 'idx_payment_history_user');
    table.dropIndex('subscription_plan_id', 'idx_payment_history_plan');
    table.dropIndex('transaction_type', 'idx_payment_history_transaction_type');
    table.dropIndex('product_type', 'idx_payment_history_product_type');
    
    // Drop columns
    table.dropColumn('user_id');
    table.dropColumn('subscription_plan_id');
    table.dropColumn('transaction_type');
    table.dropColumn('plan_name');
    table.dropColumn('product_type');
    table.dropColumn('description');
  });
};
