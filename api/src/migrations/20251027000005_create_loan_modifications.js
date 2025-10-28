/**
 * Loan Modifications History - Database Migration
 * Tracks all loan restructuring, term extensions, payment adjustments, and modifications
 */

exports.up = function(knex) {
  return knex.schema.createTable('loan_modifications', (table) => {
    table.increments('id').primary();
    table.integer('tenantId').unsigned().notNullable()
      .references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('loanId').unsigned().notNullable()
      .references('id').inTable('loans').onDelete('RESTRICT');
    
    // Modification reference number
    table.string('modificationNumber', 50).notNullable();
    
    // Type of modification: 'term_extension', 'payment_adjustment', 'interest_rate_change', 'restructuring', 'consolidation', 'refinance', 'partial_prepayment', 'other'
    table.enum('modificationType', [
      'term_extension',
      'payment_adjustment',
      'interest_rate_change',
      'restructuring',
      'consolidation',
      'refinance',
      'partial_prepayment',
      'grace_period',
      'payment_holiday',
      'other'
    ]).notNullable();
    
    // Status of the modification request
    table.enum('status', ['requested', 'approved', 'rejected', 'pending_review', 'implemented', 'cancelled'])
      .notNullable()
      .defaultTo('requested');
    
    // Who requested the modification: 'customer', 'employee', 'system', 'manager'
    table.enum('requestedBy', ['customer', 'employee', 'system', 'manager']).notNullable();
    
    // User ID of who requested
    table.integer('requestedByUserId').unsigned()
      .references('id').inTable('users').onDelete('SET NULL');
    
    // Date the modification was requested
    table.date('requestedDate').notNullable();
    
    // Date the modification was approved/implemented
    table.date('effectiveDate');
    
    // Original loan details (snapshot)
    table.decimal('originalPrincipalAmount', 15, 2);
    table.integer('originalTermDays');
    table.decimal('originalInterestRate', 5, 2);
    table.decimal('originalMonthlyPayment', 15, 2);
    table.date('originalMaturityDate');
    
    // New/Modified loan details
    table.decimal('newPrincipalAmount', 15, 2); // If principal changed (e.g., consolidation)
    table.integer('newTermDays'); // Extended term
    table.decimal('newInterestRate', 5, 2); // If rate negotiated
    table.decimal('newMonthlyPayment', 15, 2); // Adjusted payment
    table.date('newMaturityDate'); // New maturity date
    
    // For term extensions - number of months extended
    table.integer('extensionMonths');
    
    // For payment adjustments - what changed
    table.text('paymentAdjustmentReason');
    table.decimal('paymentAdjustmentAmount', 15, 2); // Amount increased/decreased
    
    // Interest rate change details
    table.decimal('interestRateChange', 5, 2); // Increase/decrease in rate
    table.string('interestRateChangeReason', 255);
    
    // Grace period details (if applicable)
    table.integer('gracePeriodDays');
    table.date('gracePeriodStartDate');
    table.date('gracePeriodEndDate');
    
    // Payment holiday (skip payments)
    table.integer('paymentHolidayMonths');
    table.date('paymentHolidayStartDate');
    table.date('paymentHolidayEndDate');
    
    // Impact analysis
    table.decimal('totalInterestImpact', 15, 2); // How much extra/less interest
    table.decimal('totalPaymentImpact', 15, 2); // Total change to payments
    table.text('modificationReason'); // Why this modification?
    
    // Approval workflow
    table.integer('approvedByUserId').unsigned()
      .references('id').inTable('users').onDelete('SET NULL');
    table.date('approvedDate');
    table.text('approvalNotes');
    
    // For rejected modifications
    table.text('rejectionReason');
    table.integer('rejectedByUserId').unsigned()
      .references('id').inTable('users').onDelete('SET NULL');
    table.date('rejectedDate');
    
    // Fees for modification (e.g., restructuring fee)
    table.decimal('modificationFee', 15, 2).defaultTo(0);
    
    // Whether fees were waived
    table.boolean('feesWaived').defaultTo(false);
    
    // Customer agreement/consent
    table.boolean('customerConsented').defaultTo(false);
    table.date('consentDate');
    
    // New repayment schedule needs to be generated
    table.boolean('scheduleRegenerationRequired').defaultTo(true);
    table.boolean('scheduleRegenerated').defaultTo(false);
    
    // Associated documents (loan agreement amendment, etc.)
    table.json('relatedDocumentIds');
    
    // Additional metadata
    table.json('metadata');
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes for performance
    table.unique(['tenantId', 'modificationNumber']);
    table.index(['tenantId', 'loanId']);
    table.index(['modificationType']);
    table.index(['status']);
    table.index(['requestedDate']);
    table.index(['effectiveDate']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('loan_modifications');
};
