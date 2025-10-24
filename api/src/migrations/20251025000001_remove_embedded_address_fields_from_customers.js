/**
 * Migration: Remove embedded address fields from customers table
 * These fields have been moved to the unified addresses table
 */

exports.up = function(knex) {
  return knex.schema.table('customers', (table) => {
    // Drop old embedded address fields
    table.dropColumn('address');
    table.dropColumn('barangay');
    table.dropColumn('city');
    table.dropColumn('province');
    table.dropColumn('postal_code');
    table.dropColumn('country');
  });
};

exports.down = function(knex) {
  return knex.schema.table('customers', (table) => {
    // Restore address fields if rollback is needed
    table.text('address');
    table.string('barangay', 100);
    table.string('city', 100);
    table.string('province', 100);
    table.string('postal_code', 20);
    table.string('country', 100).defaultTo('Philippines');
  });
};
