/**
 * Loan Product Approval Rules Configuration - Database Migration
 * Manages approval workflows, auto-approval rules, and multi-level approvals
 */

exports.up = function(knex) {
  return knex.schema.createTable('loan_product_approval_rules', (table) => {
    table.increments('id').primary();
    table.integer('tenantId').unsigned().notNullable()
      .references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('loanProductId').unsigned().notNullable()
      .references('id').inTable('loan_products').onDelete('CASCADE');
    
    // Rule name (e.g., "Auto-approve below 50k", "Manager approval for 50k-500k")
    table.string('ruleName', 100).notNullable();
    
    // Rule type: 'auto_approve', 'manual_review', 'manager_approval', 'committee_approval'
    table.enum('ruleType', ['auto_approve', 'manual_review', 'manager_approval', 'committee_approval', 'escalation'])
      .notNullable();
    
    // Minimum loan amount this rule applies to
    table.decimal('minLoanAmount', 15, 2).defaultTo(0);
    
    // Maximum loan amount this rule applies to
    table.decimal('maxLoanAmount', 15, 2);
    
    // Minimum loan term (days)
    table.integer('minLoanTermDays');
    
    // Maximum loan term (days)
    table.integer('maxLoanTermDays');
    
    // Auto-approval criteria (JSON)
    // e.g., {
    //   "minCreditScore": 700,
    //   "maxDebtToIncomeRatio": 0.4,
    //   "employmentStabilityMonths": 12,
    //   "existingCustomerForMonths": 6
    // }
    table.json('autoApprovalCriteria');
    
    // Number of approval levels required
    table.integer('approvalLevels').defaultTo(1);
    
    // Approver roles (comma-separated or JSON array)
    // e.g., 'loan_officer,branch_manager,credit_committee'
    table.json('approverRoles');
    
    // Time limit for approval (hours)
    table.integer('approvalTimeLimit');
    
    // Escalation rule (what happens if not approved in time)
    table.string('escalationRule', 255);
    
    // Whether collateral is required
    table.boolean('collateralRequired').defaultTo(false);
    
    // Minimum collateral to loan ratio (e.g., 1.2 = 120%)
    table.decimal('minCollateralToLoanRatio', 5, 2);
    
    // Required documents (JSON array of document types)
    table.json('requiredDocuments');
    
    // Whether KYC verification is required
    table.boolean('kycRequired').defaultTo(true);
    
    // Whether income verification is required
    table.boolean('incomeVerificationRequired').defaultTo(true);
    
    // Whether credit bureau check is required
    table.boolean('creditBureauCheckRequired').defaultTo(true);
    
    // Risk assessment required
    table.boolean('riskAssessmentRequired').defaultTo(true);
    
    // Conditions for this rule (JSON)
    // e.g., {"employmentStatus": "employed", "industry": ["IT", "Finance"]}
    table.json('conditions');
    
    // Priority (lower number = higher priority, used when multiple rules match)
    table.integer('priority').defaultTo(100);
    
    // Status: active or inactive
    table.boolean('isActive').defaultTo(true);
    
    // Additional metadata
    table.json('metadata');
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes for performance
    table.index(['tenantId', 'loanProductId']);
    table.index(['ruleType']);
    table.index(['priority']);
    table.index(['isActive']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('loan_product_approval_rules');
};
