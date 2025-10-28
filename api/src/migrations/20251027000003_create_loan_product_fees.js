/**
 * Loan Product Fees Configuration - Database Migration
 * Manages all types of fees: origination, processing, late payment, early settlement, etc.
 */

exports.up = function(knex) {
  return knex.schema.createTable('loan_product_fees', (table) => {
    table.increments('id').primary();
    table.integer('tenantId').unsigned().notNullable()
      .references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('loanProductId').unsigned().notNullable()
      .references('id').inTable('loan_products').onDelete('CASCADE');
    
    // Fee type: what kind of fee this is
    table.enum('feeType', [
      'origination',
      'processing',
      'documentation',
      'appraisal',
      'insurance',
      'late_payment',
      'returned_payment',
      'restructuring',
      'early_settlement',
      'statement_request',
      'service_charge',
      'account_maintenance',
      'prepayment_penalty',
      'other'
    ]).notNullable();
    
    // Fee name (human-readable)
    table.string('feeName', 100).notNullable();
    
    // Fee description
    table.text('feeDescription');
    
    // How is the fee charged: fixed amount or percentage
    table.enum('chargeType', ['fixed_amount', 'percentage_of_loan', 'percentage_of_payment', 'variable'])
      .notNullable();
    
    // Fixed amount (if chargeType is fixed_amount)
    table.decimal('fixedAmount', 15, 2);
    
    // Percentage value (if chargeType is percentage)
    table.decimal('percentageValue', 5, 2); // e.g., 2.5 for 2.5%
    
    // For late payment fees - charge method
    table.enum('latePaymentChargeMethod', ['fixed_per_day', 'fixed_per_month', 'percentage_per_day', 'percentage_per_month'])
      .comment('How to charge late payment fees');
    
    // Maximum fee cap (for late payments, etc.)
    table.decimal('maximumFeeAmount', 15, 2);
    
    // Minimum fee floor
    table.decimal('minimumFeeAmount', 15, 2);
    
    // When is this fee charged: 'upfront', 'at_maturity', 'on_event', 'monthly'
    table.enum('chargeFrequency', ['upfront', 'at_maturity', 'on_event', 'daily', 'weekly', 'monthly', 'quarterly', 'annually'])
      .notNullable();
    
    // Applicable only under certain conditions (JSON: conditions like {"minLoanAmount": 10000})
    table.json('applicableConditions');
    
    // Is this fee optional (customer can waive) or mandatory
    table.boolean('isOptional').defaultTo(false);
    
    // Is this fee waivable by admin
    table.boolean('isWaivable').defaultTo(false);
    
    // Can this fee be deferred
    table.boolean('isDeferable').defaultTo(false);
    
    // Should this fee be included in the total loan amount
    table.boolean('includeInLoanAmount').defaultTo(false);
    
    // Should this fee be included in EMI calculation
    table.boolean('includeInEmi').defaultTo(false);
    
    // Account code for accounting (for reconciliation)
    table.string('accountCode', 50);
    
    // Tax applicability
    table.boolean('isTaxable').defaultTo(false);
    table.decimal('taxPercentage', 5, 2); // If applicable
    
    // Priority order (for fee deduction)
    table.integer('deductionPriority').defaultTo(100);
    
    // Status: active or inactive
    table.boolean('isActive').defaultTo(true);
    
    // Additional metadata
    table.json('metadata');
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes for performance
    table.index(['tenantId', 'loanProductId']);
    table.index(['feeType']);
    table.index(['isActive']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('loan_product_fees');
};
