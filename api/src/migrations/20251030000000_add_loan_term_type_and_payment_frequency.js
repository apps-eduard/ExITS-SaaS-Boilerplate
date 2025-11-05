/**
 * Migration: Add loan_term_type, fixed_term_days, and payment_frequency columns
 * Date: 2025-10-30
 */

exports.up = async function(knex) {
  const hasLoanTermType = await knex.schema.hasColumn('money_loan_products', 'loan_term_type');
  const hasFixedTermDays = await knex.schema.hasColumn('money_loan_products', 'fixed_term_days');
  const hasMinTermDays = await knex.schema.hasColumn('money_loan_products', 'min_term_days');
  const hasMaxTermDays = await knex.schema.hasColumn('money_loan_products', 'max_term_days');
  const hasPaymentFrequency = await knex.schema.hasColumn('money_loan_products', 'payment_frequency');

  return knex.schema.alterTable('money_loan_products', function(table) {
    if (!hasLoanTermType) {
      // Add loan_term_type column (fixed or flexible) when missing
      table.enum('loan_term_type', ['fixed', 'flexible']).defaultTo('flexible');
    }

    if (!hasFixedTermDays) {
      // Add fixed_term_days column (nullable, only used when loan_term_type is 'fixed')
      table.integer('fixed_term_days').nullable();
    } else {
      table.integer('fixed_term_days').nullable().alter();
    }

    if (hasMinTermDays) {
      // Make min_term_days nullable when column exists
      table.integer('min_term_days').nullable().alter();
    }

    if (hasMaxTermDays) {
      // Make max_term_days nullable when column exists
      table.integer('max_term_days').nullable().alter();
    }

    if (!hasPaymentFrequency) {
      // Add payment_frequency column only if it does not already exist
      table.enum('payment_frequency', ['daily', 'weekly', 'monthly']).defaultTo('weekly');
    }
  });
};

exports.down = async function(knex) {
  const hasPaymentFrequency = await knex.schema.hasColumn('money_loan_products', 'payment_frequency');
  const hasFixedTermDays = await knex.schema.hasColumn('money_loan_products', 'fixed_term_days');
  const hasLoanTermType = await knex.schema.hasColumn('money_loan_products', 'loan_term_type');
  const hasMinTermDays = await knex.schema.hasColumn('money_loan_products', 'min_term_days');
  const hasMaxTermDays = await knex.schema.hasColumn('money_loan_products', 'max_term_days');

  if (hasPaymentFrequency) {
    await knex.schema.alterTable('money_loan_products', function(table) {
      table.dropColumn('payment_frequency');
    });
  }

  if (hasFixedTermDays) {
    await knex.schema.alterTable('money_loan_products', function(table) {
      table.dropColumn('fixed_term_days');
    });
  }

  if (hasLoanTermType) {
    await knex.schema.alterTable('money_loan_products', function(table) {
      table.dropColumn('loan_term_type');
    });
  }

  if (hasMinTermDays) {
    await knex.schema.alterTable('money_loan_products', function(table) {
      table.integer('min_term_days').notNullable().alter();
    });
  }

  if (hasMaxTermDays) {
    await knex.schema.alterTable('money_loan_products', function(table) {
      table.integer('max_term_days').notNullable().alter();
    });
  }
};
