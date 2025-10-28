/**
 * Loan Product Payment Schedules Configuration - Database Migration
 * Supports multiple payment frequencies and schedule types
 */

exports.up = function(knex) {
  return knex.schema.createTable('loan_product_payment_schedules', (table) => {
    table.increments('id').primary();
    table.integer('tenantId').unsigned().notNullable()
      .references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('loanProductId').unsigned().notNullable()
      .references('id').inTable('loan_products').onDelete('CASCADE');
    
    // Payment frequency: daily, weekly, bi-weekly, semi-monthly, monthly, quarterly, semi-annually, annually, custom
    table.enum('paymentFrequency', [
      'daily',
      'weekly',
      'bi_weekly',
      'semi_monthly',
      'monthly',
      'quarterly',
      'semi_annually',
      'annually',
      'custom'
    ]).notNullable().defaultTo('monthly');
    
    // Schedule type: 'fixed' (same payment each period) or 'flexible' (variable payments)
    table.enum('scheduleType', ['fixed', 'flexible']).notNullable().defaultTo('fixed');
    
    // Payment allocation method: which part of payment is applied first (interest/principal/fees)
    table.enum('paymentAllocationOrder', [
      'interest_principal_fees',
      'principal_interest_fees',
      'fees_interest_principal',
      'custom'
    ]).defaultTo('interest_principal_fees');
    
    // For fixed schedules - specify the day
    table.integer('dayOfWeek'); // 0-6 (Sunday-Saturday) for weekly payments
    table.integer('dayOfMonth'); // 1-31 for monthly payments
    table.integer('monthOfQuarter'); // 1-3 for quarterly payments
    
    // For fixed schedules - what to do on weekends/holidays
    table.enum('holidayHandling', ['skip_to_next_business_day', 'prepone_to_previous_business_day', 'allow_on_weekend'])
      .defaultTo('skip_to_next_business_day');
    
    // For flexible schedules
    table.decimal('minimumPaymentAmount', 15, 2); // Minimum payment required
    table.decimal('minimumPaymentPercentage', 5, 2); // e.g., 10% of outstanding balance
    table.boolean('allowEarlyPayment').defaultTo(true);
    table.boolean('allowSkippedPayment').defaultTo(false);
    table.integer('maxSkippedPaymentsPerYear').defaultTo(0);
    
    // Payment methods allowed for this schedule
    table.json('allowedPaymentMethods'); // e.g., ['bank_transfer', 'mobile_money', 'cash']
    
    // Grace period before considering payment late (days)
    table.integer('gracePeriodDays').defaultTo(0);
    
    // Auto-payment (standing order) support
    table.boolean('supportsAutoPayment').defaultTo(true);
    table.enum('autoPaymentFrequency', ['every_payment', 'specific_dates', 'never'])
      .defaultTo('never');
    
    // Maximum number of installments for this schedule
    table.integer('maxInstallments');
    
    // Whether this is the default schedule for the product
    table.boolean('isDefault').defaultTo(false);
    
    // Status: active or inactive
    table.boolean('isActive').defaultTo(true);
    
    // Additional metadata and configuration
    table.json('metadata');
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes for performance
    table.index(['tenantId', 'loanProductId']);
    table.index(['paymentFrequency']);
    table.index(['scheduleType']);
    table.index(['isActive']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('loan_product_payment_schedules');
};
