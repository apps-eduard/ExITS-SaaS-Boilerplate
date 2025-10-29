/**
 * Money Loan - Platform Configuration Service
 * Manages all configuration for Money Loan platform
 * Including: interest rates, fees, payment schedules, approval rules
 */

const knex = require('../../../../config/knex');
const logger = require('../../../../utils/logger');

class MoneyloanConfigService {
  // ═══════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Transform camelCase database result to snake_case for frontend
   */
  transformToSnakeCase(data) {
    if (!data) return null;
    if (Array.isArray(data)) {
      return data.map(item => this.transformToSnakeCase(item));
    }

    return {
      id: data.id,
      tenant_id: data.tenantId,
      loan_product_id: data.loanProductId,
      rate_type: data.interestType,
      base_rate: data.baseRate,
      min_rate: data.minRate,
      max_rate: data.maxRate,
      market_index: data.marketIndex,
      spread: data.spread,
      rate_brackets: data.rateBrackets ? JSON.parse(data.rateBrackets) : null,
      credit_score_rates: data.creditScoreRates ? JSON.parse(data.creditScoreRates) : null,
      risk_based_rates: data.riskBasedRates ? JSON.parse(data.riskBasedRates) : null,
      calculation_method: data.calculationMethod,
      recalculation_frequency: data.recalculationFrequency,
      interest_grace_period_days: data.interestGracePeriodDays,
      is_default: data.isDefault,
      is_active: data.isActive,
      metadata: data.metadata ? JSON.parse(data.metadata) : null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // Add any fields frontend might be expecting
      rate_adjustment_frequency: data.recalculationFrequency,
      effective_date: data.created_at
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // INTEREST RATE CONFIGURATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get all interest rate configurations for a loan product
   */
  async getInterestRateConfigs(tenantId, loanProductId) {
    try {
      const configs = await knex('money_loan_interest_rates')
        .where({
          tenantId: tenantId,
          loanProductId: loanProductId
        })
        .orderBy('created_at', 'asc');

      logger.info(`✅ Fetched ${configs.length} interest rate configs`);
      return this.transformToSnakeCase(configs);
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
      // Handle both snake_case (from frontend) and camelCase
      const [result] = await knex('money_loan_interest_rates').insert({
        tenantId: tenantId,
        loanProductId: loanProductId,
        interestType: configData.rateType || configData.rate_type || 'fixed',
        baseRate: configData.baseRate || configData.base_rate,
        minRate: configData.minRate || configData.min_rate,
        maxRate: configData.maxRate || configData.max_rate,
        marketIndex: configData.marketIndex || configData.market_index,
        spread: configData.spread,
        rateBrackets: (configData.rateBrackets || configData.rate_brackets) ? JSON.stringify(configData.rateBrackets || configData.rate_brackets) : null,
        creditScoreRates: (configData.creditScoreRates || configData.credit_score_rates) ? JSON.stringify(configData.creditScoreRates || configData.credit_score_rates) : null,
        riskBasedRates: (configData.riskBasedRates || configData.risk_based_rates) ? JSON.stringify(configData.riskBasedRates || configData.risk_based_rates) : null,
        calculationMethod: configData.calculationMethod || configData.calculation_method || 'daily',
        recalculationFrequency: configData.recalculationFrequency || configData.recalculation_frequency || 'never',
        interestGracePeriodDays: configData.interestGracePeriodDays || configData.interest_grace_period_days || 0,
        isDefault: configData.isDefault || configData.is_default || false,
        isActive: configData.isActive !== undefined ? configData.isActive : (configData.is_active !== undefined ? configData.is_active : true),
        metadata: (configData.metadata) ? JSON.stringify(configData.metadata) : null
      }, ['id']);

      const id = result.id;
      logger.info(`✅ Interest rate config created with ID: ${id}`);
      const created = await knex('money_loan_interest_rates').where({ id }).first();
      return this.transformToSnakeCase(created);
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
      // Handle both snake_case (from frontend) and camelCase
      const updates = {
        interestType: updateData.rateType || updateData.rate_type,
        baseRate: updateData.baseRate || updateData.base_rate,
        minRate: updateData.minRate || updateData.min_rate,
        maxRate: updateData.maxRate || updateData.max_rate,
        marketIndex: updateData.marketIndex || updateData.market_index,
        spread: updateData.spread,
        rateBrackets: (updateData.rateBrackets || updateData.rate_brackets) ? JSON.stringify(updateData.rateBrackets || updateData.rate_brackets) : undefined,
        creditScoreRates: (updateData.creditScoreRates || updateData.credit_score_rates) ? JSON.stringify(updateData.creditScoreRates || updateData.credit_score_rates) : undefined,
        riskBasedRates: (updateData.riskBasedRates || updateData.risk_based_rates) ? JSON.stringify(updateData.riskBasedRates || updateData.risk_based_rates) : undefined,
        calculationMethod: updateData.calculationMethod || updateData.calculation_method,
        recalculationFrequency: updateData.recalculationFrequency || updateData.recalculation_frequency,
        interestGracePeriodDays: updateData.interestGracePeriodDays || updateData.interest_grace_period_days,
        isDefault: updateData.isDefault !== undefined ? updateData.isDefault : updateData.is_default,
        isActive: updateData.isActive !== undefined ? updateData.isActive : updateData.is_active,
        metadata: updateData.metadata ? JSON.stringify(updateData.metadata) : undefined
      };

      // Remove undefined fields
      Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

      await knex('money_loan_interest_rates')
        .where({
          tenantId: tenantId,
          loanProductId: loanProductId,
          id: rateId
        })
        .update(updates);

      logger.info(`✅ Interest rate config ${rateId} updated`);
      const updated = await knex('money_loan_interest_rates').where({ id: rateId }).first();
      return this.transformToSnakeCase(updated);
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
      const result = await knex('money_loan_interest_rates')
        .where({
          tenantId: tenantId,
          loanProductId: loanProductId,
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

  /**
   * Transform payment schedule to snake_case for frontend
   */
  transformPaymentScheduleToSnakeCase(data) {
    if (!data) return null;
    if (Array.isArray(data)) {
      return data.map(item => this.transformPaymentScheduleToSnakeCase(item));
    }

    return {
      id: data.id,
      tenant_id: data.tenantId,
      loan_product_id: data.loanProductId,
      payment_frequency: data.paymentFrequency,
      schedule_type: data.scheduleType,
      payment_allocation_order: data.paymentAllocationOrder,
      day_of_week: data.dayOfWeek,
      day_of_month: data.dayOfMonth,
      month_of_quarter: data.monthOfQuarter,
      holiday_handling: data.holidayHandling,
      minimum_payment_amount: data.minimumPaymentAmount,
      minimum_payment_percentage: data.minimumPaymentPercentage,
      allow_early_payment: data.allowEarlyPayment,
      allow_skipped_payment: data.allowSkippedPayment,
      max_skipped_payments_per_year: data.maxSkippedPaymentsPerYear,
      allowed_payment_methods: data.allowedPaymentMethods ? JSON.parse(data.allowedPaymentMethods) : null,
      grace_period_days: data.gracePeriodDays,
      supports_auto_payment: data.supportsAutoPayment,
      auto_payment_frequency: data.autoPaymentFrequency,
      max_installments: data.maxInstallments,
      is_default: data.isDefault,
      is_active: data.isActive,
      metadata: data.metadata ? JSON.parse(data.metadata) : null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // Alias for frontend compatibility
      day_of_payment: data.dayOfMonth,
      late_payment_penalty_type: data.metadata ? JSON.parse(data.metadata).late_payment_penalty_type : null,
      late_payment_penalty_value: data.metadata ? JSON.parse(data.metadata).late_payment_penalty_value : null
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // PAYMENT SCHEDULE CONFIGURATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get all payment schedule configurations
   */
  async getPaymentScheduleConfigs(tenantId, loanProductId) {
    try {
      const configs = await knex('money_loan_payment_schedules')
        .where({
          tenantId: tenantId,
          loanProductId: loanProductId
        })
        .orderBy('created_at', 'asc');

      logger.info(`✅ Fetched ${configs.length} payment schedule configs`);
      return this.transformPaymentScheduleToSnakeCase(configs);
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
      // Handle both snake_case (from frontend) and camelCase
      const metadata = {
        ...(configData.metadata || {}),
        late_payment_penalty_type: configData.late_payment_penalty_type || configData.latePaymentPenaltyType,
        late_payment_penalty_value: configData.late_payment_penalty_value || configData.latePaymentPenaltyValue
      };

      const [result] = await knex('money_loan_payment_schedules').insert({
        tenantId: tenantId,
        loanProductId: loanProductId,
        paymentFrequency: configData.payment_frequency || configData.paymentFrequency || 'monthly',
        scheduleType: configData.schedule_type || configData.scheduleType || 'fixed',
        paymentAllocationOrder: configData.payment_allocation_order || configData.paymentAllocationOrder || 'interest_principal_fees',
        dayOfWeek: configData.day_of_week || configData.dayOfWeek,
        dayOfMonth: configData.day_of_month || configData.day_of_payment || configData.dayOfMonth,
        monthOfQuarter: configData.month_of_quarter || configData.monthOfQuarter,
        holidayHandling: configData.holiday_handling || configData.holidayHandling || 'skip_to_next_business_day',
        minimumPaymentAmount: configData.minimum_payment_amount || configData.minimumPaymentAmount,
        minimumPaymentPercentage: configData.minimum_payment_percentage || configData.minimumPaymentPercentage,
        allowEarlyPayment: configData.allow_early_payment !== undefined ? configData.allow_early_payment : (configData.allowEarlyPayment !== undefined ? configData.allowEarlyPayment : true),
        allowSkippedPayment: configData.allow_skipped_payment !== undefined ? configData.allow_skipped_payment : (configData.allowSkippedPayment !== undefined ? configData.allowSkippedPayment : false),
        maxSkippedPaymentsPerYear: configData.max_skipped_payments_per_year || configData.maxSkippedPaymentsPerYear || 0,
        allowedPaymentMethods: configData.allowed_payment_methods ? JSON.stringify(configData.allowed_payment_methods) : null,
        gracePeriodDays: configData.grace_period_days || configData.gracePeriodDays || 0,
        supportsAutoPayment: configData.supports_auto_payment !== undefined ? configData.supports_auto_payment : (configData.supportsAutoPayment !== undefined ? configData.supportsAutoPayment : true),
        autoPaymentFrequency: configData.auto_payment_frequency || configData.autoPaymentFrequency || 'never',
        maxInstallments: configData.max_installments || configData.maxInstallments,
        isDefault: configData.is_default !== undefined ? configData.is_default : (configData.isDefault !== undefined ? configData.isDefault : false),
        isActive: configData.is_active !== undefined ? configData.is_active : (configData.isActive !== undefined ? configData.isActive : true),
        metadata: JSON.stringify(metadata)
      }, ['id']);

      const id = result.id;
      logger.info(`✅ Payment schedule config created with ID: ${id}`);
      const created = await knex('money_loan_payment_schedules').where({ id }).first();
      return this.transformPaymentScheduleToSnakeCase(created);
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
      // Handle both snake_case (from frontend) and camelCase
      const metadata = {
        ...(updateData.metadata || {}),
        late_payment_penalty_type: updateData.late_payment_penalty_type || updateData.latePaymentPenaltyType,
        late_payment_penalty_value: updateData.late_payment_penalty_value || updateData.latePaymentPenaltyValue
      };

      const updates = {
        paymentFrequency: updateData.payment_frequency || updateData.paymentFrequency,
        scheduleType: updateData.schedule_type || updateData.scheduleType,
        paymentAllocationOrder: updateData.payment_allocation_order || updateData.paymentAllocationOrder,
        dayOfWeek: updateData.day_of_week || updateData.dayOfWeek,
        dayOfMonth: updateData.day_of_month || updateData.day_of_payment || updateData.dayOfMonth,
        monthOfQuarter: updateData.month_of_quarter || updateData.monthOfQuarter,
        holidayHandling: updateData.holiday_handling || updateData.holidayHandling,
        minimumPaymentAmount: updateData.minimum_payment_amount || updateData.minimumPaymentAmount,
        minimumPaymentPercentage: updateData.minimum_payment_percentage || updateData.minimumPaymentPercentage,
        allowEarlyPayment: updateData.allow_early_payment !== undefined ? updateData.allow_early_payment : updateData.allowEarlyPayment,
        allowSkippedPayment: updateData.allow_skipped_payment !== undefined ? updateData.allow_skipped_payment : updateData.allowSkippedPayment,
        maxSkippedPaymentsPerYear: updateData.max_skipped_payments_per_year || updateData.maxSkippedPaymentsPerYear,
        allowedPaymentMethods: (updateData.allowed_payment_methods || updateData.allowedPaymentMethods) ? JSON.stringify(updateData.allowed_payment_methods || updateData.allowedPaymentMethods) : undefined,
        gracePeriodDays: updateData.grace_period_days !== undefined ? updateData.grace_period_days : updateData.gracePeriodDays,
        supportsAutoPayment: updateData.supports_auto_payment !== undefined ? updateData.supports_auto_payment : updateData.supportsAutoPayment,
        autoPaymentFrequency: updateData.auto_payment_frequency || updateData.autoPaymentFrequency,
        maxInstallments: updateData.max_installments || updateData.maxInstallments,
        isDefault: updateData.is_default !== undefined ? updateData.is_default : updateData.isDefault,
        isActive: updateData.is_active !== undefined ? updateData.is_active : updateData.isActive,
        metadata: JSON.stringify(metadata)
      };

      Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

      await knex('money_loan_payment_schedules')
        .where({
          tenantId: tenantId,
          loanProductId: loanProductId,
          id: scheduleId
        })
        .update(updates);

      logger.info(`✅ Payment schedule config ${scheduleId} updated`);
      const updated = await knex('money_loan_payment_schedules').where({ id: scheduleId }).first();
      return this.transformPaymentScheduleToSnakeCase(updated);
    } catch (error) {
      logger.error('❌ Error updating payment schedule config:', error);
      throw error;
    }
  }

  /**
   * Delete payment schedule configuration
   */
  async deletePaymentScheduleConfig(tenantId, loanProductId, scheduleId) {
    try {
      const result = await knex('money_loan_payment_schedules')
        .where({
          tenantId: tenantId,
          loanProductId: loanProductId,
          id: scheduleId
        })
        .delete();

      logger.info(`✅ Payment schedule config ${scheduleId} deleted`);
      return result > 0;
    } catch (error) {
      logger.error('❌ Error deleting payment schedule config:', error);
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
      const configs = await knex('money_loan_fees')
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
      const [id] = await knex('money_loan_fees').insert({
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
      return knex('money_loan_fees').where({ id }).first();
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

      await knex('money_loan_fees')
        .where({
          tenant_id: tenantId,
          loan_product_id: loanProductId,
          id: feeId
        })
        .update(updates);

      logger.info(`✅ Fee config ${feeId} updated`);
      return knex('money_loan_fees').where({ id: feeId }).first();
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
      const configs = await knex('money_loan_approval_rules')
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
      const [id] = await knex('money_loan_approval_rules').insert({
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
      return knex('money_loan_approval_rules').where({ id }).first();
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

      await knex('money_loan_approval_rules')
        .where({
          tenant_id: tenantId,
          loan_product_id: loanProductId,
          id: ruleId
        })
        .update(updates);

      logger.info(`✅ Approval rule config ${ruleId} updated`);
      return knex('money_loan_approval_rules').where({ id: ruleId }).first();
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
