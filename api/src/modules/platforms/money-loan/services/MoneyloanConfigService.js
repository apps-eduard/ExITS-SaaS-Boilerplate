/**
 * Money Loan - Platform Configuration Service
 * Manages all configuration for Money Loan platform
 * Including: interest rates, fees, payment schedules, approval rules
 */

const knex = require('../../../../config/database');
const logger = require('../../../../utils/logger');

class MoneyloanConfigService {
  // ═══════════════════════════════════════════════════════════════
  // INTEREST RATE CONFIGURATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get all interest rate configurations for a loan product
   */
  async getInterestRateConfigs(tenantId, loanProductId) {
    try {
      const configs = await knex('loan_product_interest_rates')
        .where({
          tenant_id: tenantId,
          loan_product_id: loanProductId
        })
        .orderBy('created_at', 'asc');

      logger.info(`✅ Fetched ${configs.length} interest rate configs`);
      return configs;
    } catch (error) {
      logger.error('❌ Error fetching interest rate configs:', error);
      throw error;
    }
  }

  /**
   * Create interest rate configuration
   */
  async createInterestRateConfig(tenantId, loanProductId, configData) {
    try {
      const [id] = await knex('loan_product_interest_rates').insert({
        tenant_id: tenantId,
        loan_product_id: loanProductId,
        rate_type: configData.rateType, // 'fixed', 'variable', 'declining', 'flat', 'compound'
        base_rate: configData.baseRate,
        min_rate: configData.minRate,
        max_rate: configData.maxRate,
        rate_name: configData.rateName,
        description: configData.description,
        calculation_method: configData.calculationMethod,
        tier_based_rates: JSON.stringify(configData.tierBasedRates || {}),
        is_active: configData.isActive !== false,
        metadata: JSON.stringify(configData.metadata || {}),
        created_at: new Date(),
        updated_at: new Date()
      });

      logger.info(`✅ Interest rate config created with ID: ${id}`);
      return knex('loan_product_interest_rates').where({ id }).first();
    } catch (error) {
      logger.error('❌ Error creating interest rate config:', error);
      throw error;
    }
  }

  /**
   * Update interest rate configuration
   */
  async updateInterestRateConfig(tenantId, loanProductId, rateId, updateData) {
    try {
      const updates = {
        rate_type: updateData.rateType,
        base_rate: updateData.baseRate,
        min_rate: updateData.minRate,
        max_rate: updateData.maxRate,
        rate_name: updateData.rateName,
        description: updateData.description,
        calculation_method: updateData.calculationMethod,
        tier_based_rates: updateData.tierBasedRates ? JSON.stringify(updateData.tierBasedRates) : undefined,
        is_active: updateData.isActive,
        metadata: updateData.metadata ? JSON.stringify(updateData.metadata) : undefined,
        updated_at: new Date()
      };

      // Remove undefined fields
      Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

      await knex('loan_product_interest_rates')
        .where({
          tenant_id: tenantId,
          loan_product_id: loanProductId,
          id: rateId
        })
        .update(updates);

      logger.info(`✅ Interest rate config ${rateId} updated`);
      return knex('loan_product_interest_rates').where({ id: rateId }).first();
    } catch (error) {
      logger.error('❌ Error updating interest rate config:', error);
      throw error;
    }
  }

  /**
   * Delete interest rate configuration
   */
  async deleteInterestRateConfig(tenantId, loanProductId, rateId) {
    try {
      const result = await knex('loan_product_interest_rates')
        .where({
          tenant_id: tenantId,
          loan_product_id: loanProductId,
          id: rateId
        })
        .delete();

      logger.info(`✅ Interest rate config ${rateId} deleted`);
      return result > 0;
    } catch (error) {
      logger.error('❌ Error deleting interest rate config:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PAYMENT SCHEDULE CONFIGURATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get all payment schedule configurations
   */
  async getPaymentScheduleConfigs(tenantId, loanProductId) {
    try {
      const configs = await knex('loan_product_payment_schedules')
        .where({
          tenant_id: tenantId,
          loan_product_id: loanProductId
        })
        .orderBy('created_at', 'asc');

      logger.info(`✅ Fetched ${configs.length} payment schedule configs`);
      return configs;
    } catch (error) {
      logger.error('❌ Error fetching payment schedule configs:', error);
      throw error;
    }
  }

  /**
   * Create payment schedule configuration
   */
  async createPaymentScheduleConfig(tenantId, loanProductId, configData) {
    try {
      const [id] = await knex('loan_product_payment_schedules').insert({
        tenant_id: tenantId,
        loan_product_id: loanProductId,
        frequency: configData.frequency, // 'daily', 'weekly', 'monthly', 'quarterly', 'custom'
        schedule_type: configData.scheduleType, // 'fixed', 'flexible'
        schedule_name: configData.scheduleName,
        description: configData.description,
        fixed_day_of_month: configData.fixedDayOfMonth,
        fixed_day_of_week: configData.fixedDayOfWeek,
        allow_early_payment: configData.allowEarlyPayment || false,
        allow_skipped_payment: configData.allowSkippedPayment || false,
        min_payment_percentage: configData.minPaymentPercentage,
        payment_allocation_order: JSON.stringify(configData.paymentAllocationOrder || ['fees', 'penalties', 'interest', 'principal']),
        is_active: configData.isActive !== false,
        metadata: JSON.stringify(configData.metadata || {}),
        created_at: new Date(),
        updated_at: new Date()
      });

      logger.info(`✅ Payment schedule config created with ID: ${id}`);
      return knex('loan_product_payment_schedules').where({ id }).first();
    } catch (error) {
      logger.error('❌ Error creating payment schedule config:', error);
      throw error;
    }
  }

  /**
   * Update payment schedule configuration
   */
  async updatePaymentScheduleConfig(tenantId, loanProductId, scheduleId, updateData) {
    try {
      const updates = {
        frequency: updateData.frequency,
        schedule_type: updateData.scheduleType,
        schedule_name: updateData.scheduleName,
        description: updateData.description,
        fixed_day_of_month: updateData.fixedDayOfMonth,
        fixed_day_of_week: updateData.fixedDayOfWeek,
        allow_early_payment: updateData.allowEarlyPayment,
        allow_skipped_payment: updateData.allowSkippedPayment,
        min_payment_percentage: updateData.minPaymentPercentage,
        payment_allocation_order: updateData.paymentAllocationOrder ? JSON.stringify(updateData.paymentAllocationOrder) : undefined,
        is_active: updateData.isActive,
        metadata: updateData.metadata ? JSON.stringify(updateData.metadata) : undefined,
        updated_at: new Date()
      };

      Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

      await knex('loan_product_payment_schedules')
        .where({
          tenant_id: tenantId,
          loan_product_id: loanProductId,
          id: scheduleId
        })
        .update(updates);

      logger.info(`✅ Payment schedule config ${scheduleId} updated`);
      return knex('loan_product_payment_schedules').where({ id: scheduleId }).first();
    } catch (error) {
      logger.error('❌ Error updating payment schedule config:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FEE STRUCTURE CONFIGURATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get all fee configurations
   */
  async getFeeConfigs(tenantId, loanProductId) {
    try {
      const configs = await knex('loan_product_fees')
        .where({
          tenant_id: tenantId,
          loan_product_id: loanProductId
        })
        .orderBy('fee_type', 'asc');

      logger.info(`✅ Fetched ${configs.length} fee configs`);
      return configs;
    } catch (error) {
      logger.error('❌ Error fetching fee configs:', error);
      throw error;
    }
  }

  /**
   * Create fee configuration
   */
  async createFeeConfig(tenantId, loanProductId, configData) {
    try {
      const [id] = await knex('loan_product_fees').insert({
        tenant_id: tenantId,
        loan_product_id: loanProductId,
        fee_type: configData.feeType, // 'origination', 'processing', 'late_payment', 'early_settlement', 'modification'
        fee_name: configData.feeName,
        description: configData.description,
        fee_amount: configData.feeAmount,
        fee_percentage: configData.feePercentage,
        calculation_basis: configData.calculationBasis, // 'principal', 'total_amount', 'flat'
        max_fee_amount: configData.maxFeeAmount,
        min_fee_amount: configData.minFeeAmount,
        waivable: configData.waivable || false,
        is_active: configData.isActive !== false,
        metadata: JSON.stringify(configData.metadata || {}),
        created_at: new Date(),
        updated_at: new Date()
      });

      logger.info(`✅ Fee config created with ID: ${id}`);
      return knex('loan_product_fees').where({ id }).first();
    } catch (error) {
      logger.error('❌ Error creating fee config:', error);
      throw error;
    }
  }

  /**
   * Update fee configuration
   */
  async updateFeeConfig(tenantId, loanProductId, feeId, updateData) {
    try {
      const updates = {
        fee_type: updateData.feeType,
        fee_name: updateData.feeName,
        description: updateData.description,
        fee_amount: updateData.feeAmount,
        fee_percentage: updateData.feePercentage,
        calculation_basis: updateData.calculationBasis,
        max_fee_amount: updateData.maxFeeAmount,
        min_fee_amount: updateData.minFeeAmount,
        waivable: updateData.waivable,
        is_active: updateData.isActive,
        metadata: updateData.metadata ? JSON.stringify(updateData.metadata) : undefined,
        updated_at: new Date()
      };

      Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

      await knex('loan_product_fees')
        .where({
          tenant_id: tenantId,
          loan_product_id: loanProductId,
          id: feeId
        })
        .update(updates);

      logger.info(`✅ Fee config ${feeId} updated`);
      return knex('loan_product_fees').where({ id: feeId }).first();
    } catch (error) {
      logger.error('❌ Error updating fee config:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // APPROVAL RULES CONFIGURATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get all approval rule configurations
   */
  async getApprovalRuleConfigs(tenantId, loanProductId) {
    try {
      const configs = await knex('loan_product_approval_rules')
        .where({
          tenant_id: tenantId,
          loan_product_id: loanProductId
        })
        .orderBy('approval_level', 'asc');

      logger.info(`✅ Fetched ${configs.length} approval rule configs`);
      return configs;
    } catch (error) {
      logger.error('❌ Error fetching approval rule configs:', error);
      throw error;
    }
  }

  /**
   * Create approval rule configuration
   */
  async createApprovalRuleConfig(tenantId, loanProductId, configData) {
    try {
      const [id] = await knex('loan_product_approval_rules').insert({
        tenant_id: tenantId,
        loan_product_id: loanProductId,
        approval_level: configData.approvalLevel,
        rule_name: configData.ruleName,
        description: configData.description,
        loan_amount_min: configData.loanAmountMin,
        loan_amount_max: configData.loanAmountMax,
        required_role: configData.requiredRole,
        required_document_count: configData.requiredDocumentCount,
        credit_score_min: configData.creditScoreMin,
        auto_approve: configData.autoApprove || false,
        auto_approve_below_amount: configData.autoApproveBelowAmount,
        require_collateral: configData.requireCollateral || false,
        require_guarantor: configData.requireGuarantor || false,
        max_approval_days: configData.maxApprovalDays,
        is_active: configData.isActive !== false,
        metadata: JSON.stringify(configData.metadata || {}),
        created_at: new Date(),
        updated_at: new Date()
      });

      logger.info(`✅ Approval rule config created with ID: ${id}`);
      return knex('loan_product_approval_rules').where({ id }).first();
    } catch (error) {
      logger.error('❌ Error creating approval rule config:', error);
      throw error;
    }
  }

  /**
   * Update approval rule configuration
   */
  async updateApprovalRuleConfig(tenantId, loanProductId, ruleId, updateData) {
    try {
      const updates = {
        approval_level: updateData.approvalLevel,
        rule_name: updateData.ruleName,
        description: updateData.description,
        loan_amount_min: updateData.loanAmountMin,
        loan_amount_max: updateData.loanAmountMax,
        required_role: updateData.requiredRole,
        required_document_count: updateData.requiredDocumentCount,
        credit_score_min: updateData.creditScoreMin,
        auto_approve: updateData.autoApprove,
        auto_approve_below_amount: updateData.autoApproveBelowAmount,
        require_collateral: updateData.requireCollateral,
        require_guarantor: updateData.requireGuarantor,
        max_approval_days: updateData.maxApprovalDays,
        is_active: updateData.isActive,
        metadata: updateData.metadata ? JSON.stringify(updateData.metadata) : undefined,
        updated_at: new Date()
      };

      Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

      await knex('loan_product_approval_rules')
        .where({
          tenant_id: tenantId,
          loan_product_id: loanProductId,
          id: ruleId
        })
        .update(updates);

      logger.info(`✅ Approval rule config ${ruleId} updated`);
      return knex('loan_product_approval_rules').where({ id: ruleId }).first();
    } catch (error) {
      logger.error('❌ Error updating approval rule config:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // LOAN MODIFICATIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get all loan modifications for a loan
   */
  async getLoanModifications(tenantId, loanId) {
    try {
      const modifications = await knex('loan_modifications')
        .where({
          tenant_id: tenantId,
          loan_id: loanId
        })
        .orderBy('created_at', 'desc');

      logger.info(`✅ Fetched ${modifications.length} loan modifications`);
      return modifications;
    } catch (error) {
      logger.error('❌ Error fetching loan modifications:', error);
      throw error;
    }
  }

  /**
   * Create loan modification
   */
  async createLoanModification(tenantId, loanId, modificationData) {
    try {
      const [id] = await knex('loan_modifications').insert({
        tenant_id: tenantId,
        loan_id: loanId,
        modification_type: modificationData.modificationType, // 'term_extension', 'payment_adjustment', 'restructuring', 'refinancing'
        modification_name: modificationData.modificationName,
        description: modificationData.description,
        original_term_days: modificationData.originalTermDays,
        new_term_days: modificationData.newTermDays,
        original_monthly_payment: modificationData.originalMonthlyPayment,
        new_monthly_payment: modificationData.newMonthlyPayment,
        original_interest_rate: modificationData.originalInterestRate,
        new_interest_rate: modificationData.newInterestRate,
        modification_fees: modificationData.modificationFees,
        reason: modificationData.reason,
        status: modificationData.status || 'pending',
        approved_by: modificationData.approvedBy,
        approved_at: modificationData.approvedAt,
        effective_date: modificationData.effectiveDate,
        metadata: JSON.stringify(modificationData.metadata || {}),
        created_at: new Date(),
        updated_at: new Date()
      });

      logger.info(`✅ Loan modification created with ID: ${id}`);
      return knex('loan_modifications').where({ id }).first();
    } catch (error) {
      logger.error('❌ Error creating loan modification:', error);
      throw error;
    }
  }

  /**
   * Update loan modification
   */
  async updateLoanModification(tenantId, modificationId, updateData) {
    try {
      const updates = {
        modification_type: updateData.modificationType,
        modification_name: updateData.modificationName,
        description: updateData.description,
        new_term_days: updateData.newTermDays,
        new_monthly_payment: updateData.newMonthlyPayment,
        new_interest_rate: updateData.newInterestRate,
        modification_fees: updateData.modificationFees,
        reason: updateData.reason,
        status: updateData.status,
        approved_by: updateData.approvedBy,
        approved_at: updateData.approvedAt,
        effective_date: updateData.effectiveDate,
        metadata: updateData.metadata ? JSON.stringify(updateData.metadata) : undefined,
        updated_at: new Date()
      };

      Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

      await knex('loan_modifications')
        .where({
          tenant_id: tenantId,
          id: modificationId
        })
        .update(updates);

      logger.info(`✅ Loan modification ${modificationId} updated`);
      return knex('loan_modifications').where({ id: modificationId }).first();
    } catch (error) {
      logger.error('❌ Error updating loan modification:', error);
      throw error;
    }
  }

  /**
   * Approve loan modification
   */
  async approveLoanModification(tenantId, modificationId, approvalData) {
    try {
      return await this.updateLoanModification(tenantId, modificationId, {
        status: 'approved',
        approvedBy: approvalData.approvedBy,
        approvedAt: new Date(),
        effectiveDate: approvalData.effectiveDate
      });
    } catch (error) {
      logger.error('❌ Error approving loan modification:', error);
      throw error;
    }
  }

  /**
   * Reject loan modification
   */
  async rejectLoanModification(tenantId, modificationId, reason) {
    try {
      return await this.updateLoanModification(tenantId, modificationId, {
        status: 'rejected',
        metadata: { rejectionReason: reason }
      });
    } catch (error) {
      logger.error('❌ Error rejecting loan modification:', error);
      throw error;
    }
  }
}

module.exports = new MoneyloanConfigService();
