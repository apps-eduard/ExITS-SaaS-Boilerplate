/**
 * Migration: Add disbursement fields to money_loan_loans table
 * Created: 2025-01-31
 */

exports.up = function(knex) {
  return knex.schema.table('money_loan_loans', (table) => {
    table.string('disbursement_method', 50);
    table.string('disbursement_reference', 100);
    table.text('disbursement_notes');
  });
};

exports.down = function(knex) {
  return knex.schema.table('money_loan_loans', (table) => {
    table.dropColumn('disbursement_method');
    table.dropColumn('disbursement_reference');
    table.dropColumn('disbursement_notes');
  });
};
