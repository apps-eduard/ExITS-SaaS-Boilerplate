/**
 * Migration: Add disbursement fields to money_loan_loans table
 * Created: 2025-01-31
 */

exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('money_loan_loans');
  if (!exists) {
    console.warn('⚠️  money_loan_loans table not found, skipping disbursement columns migration');
    return;
  }

  const hasMethod = await knex.schema.hasColumn('money_loan_loans', 'disbursement_method');
  if (!hasMethod) {
    await knex.schema.table('money_loan_loans', (table) => {
      table.string('disbursement_method', 50);
      table.string('disbursement_reference', 100);
      table.text('disbursement_notes');
    });
  }
};

exports.down = async function (knex) {
  const exists = await knex.schema.hasTable('money_loan_loans');
  if (!exists) {
    return;
  }

  const hasMethod = await knex.schema.hasColumn('money_loan_loans', 'disbursement_method');
  if (hasMethod) {
    await knex.schema.table('money_loan_loans', (table) => {
      table.dropColumn('disbursement_method');
      table.dropColumn('disbursement_reference');
      table.dropColumn('disbursement_notes');
    });
  }
};
