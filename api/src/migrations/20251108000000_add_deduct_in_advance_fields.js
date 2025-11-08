/**
 * Migration: Add deduct in advance options for loan products
 * Allows products to deduct platform fee, processing fee, and interest upfront during disbursement
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  await knex.schema.table('money_loan_products', table => {
    table.boolean('deduct_platform_fee_in_advance').defaultTo(false).comment('Deduct platform fee from disbursed amount');
    table.boolean('deduct_processing_fee_in_advance').defaultTo(false).comment('Deduct processing fee from disbursed amount');
    table.boolean('deduct_interest_in_advance').defaultTo(false).comment('Deduct total interest from disbursed amount');
  });

  console.log('✅ Added deduct_in_advance fields to money_loan_products table');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  await knex.schema.table('money_loan_products', table => {
    table.dropColumn('deduct_platform_fee_in_advance');
    table.dropColumn('deduct_processing_fee_in_advance');
    table.dropColumn('deduct_interest_in_advance');
  });

  console.log('✅ Removed deduct_in_advance fields from money_loan_products table');
};
