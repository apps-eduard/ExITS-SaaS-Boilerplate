/**
 * Loan Product Interest Rates Configuration - Database Migration
 * Supports multiple interest rate types: Fixed, Variable, Declining Balance, Flat Rate, Compound
 */

exports.up = function(knex) {
  return knex.schema.createTable('loan_product_interest_rates', (table) => {
    table.increments('id').primary();
    table.integer('tenantId').unsigned().notNullable()
      .references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('loanProductId').unsigned().notNullable()
      .references('id').inTable('loan_products').onDelete('CASCADE');
    
    // Interest rate type: 'fixed', 'variable', 'declining_balance', 'flat_rate', 'compound'
    table.enum('interestType', ['fixed', 'variable', 'declining_balance', 'flat_rate', 'compound'])
      .notNullable()
      .defaultTo('fixed');
    
    // Base rate (the core interest rate)
    table.decimal('baseRate', 5, 2).notNullable(); // e.g., 15.50 for 15.5%
    
    // For variable rates - market index adjustment
    table.string('marketIndex', 50); // e.g., 'prime_rate', 'libor', 'tbill'
    table.decimal('spread', 5, 2); // Additional percentage above market index
    
    // For tiered/bracket-based rates (e.g., different rates by loan amount)
    table.json('rateBrackets'); // e.g., [{minAmount: 10000, maxAmount: 50000, rate: 15}, ...]
    
    // For credit score based rates
    table.json('creditScoreRates'); // e.g., [{minScore: 750, maxScore: 850, rate: 10}, ...]
    
    // For risk-based rates
    table.json('riskBasedRates'); // e.g., [{riskCategory: 'low', rate: 12}, {riskCategory: 'medium', rate: 18}, ...]
    
    // Minimum and maximum rates allowed
    table.decimal('minRate', 5, 2); // Minimum rate allowed
    table.decimal('maxRate', 5, 2); // Maximum rate allowed
    
    // Calculation method for interest accrual
    table.enum('calculationMethod', ['simple', 'compound', 'daily', 'monthly', 'annually'])
      .defaultTo('daily');
    
    // When to recalculate (for variable rates)
    table.enum('recalculationFrequency', ['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'never'])
      .defaultTo('never');
    
    // Grace period for interest calculation (days)
    table.integer('interestGracePeriodDays').defaultTo(0);
    
    // Whether this is the default rate for the product
    table.boolean('isDefault').defaultTo(false);
    
    // Status: active or inactive
    table.boolean('isActive').defaultTo(true);
    
    // Additional metadata
    table.json('metadata');
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes for performance
    table.index(['tenantId', 'loanProductId']);
    table.index(['interestType']);
    table.index(['isActive']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('loan_product_interest_rates');
};
