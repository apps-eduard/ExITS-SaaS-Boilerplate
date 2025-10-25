/**
 * Migration: Add price and billing_cycle to tenant_subscriptions
 * These fields are needed for subscription management
 */

exports.up = function(knex) {
  return knex.schema.table('tenant_subscriptions', function(table) {
    // Add price column (same as product_subscriptions)
    table.decimal('price', 10, 2).defaultTo(0.00);
    
    // Add billing_cycle column
    table.string('billing_cycle', 20).defaultTo('monthly');
  });
};

exports.down = function(knex) {
  return knex.schema.table('tenant_subscriptions', function(table) {
    table.dropColumn('price');
    table.dropColumn('billing_cycle');
  });
};
