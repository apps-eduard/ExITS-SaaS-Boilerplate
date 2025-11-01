/**
 * Migration: Add unique constraint to tenants.contact_email
 * This ensures each contact email can only be used by one tenant
 */

exports.up = function(knex) {
  return knex.schema.alterTable('tenants', function(table) {
    // Add unique constraint to contact_email
    table.unique('contact_email', 'tenants_contact_email_unique');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('tenants', function(table) {
    // Remove unique constraint
    table.dropUnique('contact_email', 'tenants_contact_email_unique');
  });
};
