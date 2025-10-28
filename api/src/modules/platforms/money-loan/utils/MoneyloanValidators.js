/**
 * Money Loan - Validators
 * Shared validation logic for Money Loan platform
 */

const logger = require('../../../../utils/logger');

class MoneyloanValidators {
  /**
   * Validate loan application data
   */
  validateLoanApplication(data) {
    const errors = [];

    // Customer ID
    if (!data.customerId) {
      errors.push('Customer ID is required');
    }

    // Loan Product ID
    if (!data.loanProductId) {
      errors.push('Loan Product ID is required');
    }

    // Requested Amount
    if (!data.requestedAmount || data.requestedAmount <= 0) {
      errors.push('Requested amount must be greater than 0');
    }

    if (data.requestedAmount > 10000000) {
      // 10M max
      errors.push('Requested amount exceeds maximum limit');
    }

    // Requested Term
    if (!data.requestedTermDays || data.requestedTermDays <= 0) {
      errors.push('Loan term must be greater than 0 days');
    }

    if (data.requestedTermDays > 7300) {
      // 20 years max
      errors.push('Loan term cannot exceed 20 years');
    }

    // Purpose
    if (!data.purpose || data.purpose.trim() === '') {
      errors.push('Loan purpose is required');
    }

    // Credit Score (if provided)
    if (data.creditScore !== undefined && (data.creditScore < 0 || data.creditScore > 1000)) {
      errors.push('Credit score must be between 0 and 1000');
    }

    // Annual Income (if provided)
    if (data.annualIncome !== undefined && data.annualIncome < 0) {
      errors.push('Annual income cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate loan approval data
   */
  validateLoanApproval(data) {
    const errors = [];

    if (!data.approvedBy) {
      errors.push('Approver ID is required');
    }

    if (data.approvedAmount && data.approvedAmount <= 0) {
      errors.push('Approved amount must be greater than 0');
    }

    if (!data.interestRate || data.interestRate < 0) {
      errors.push('Interest rate is required and must be non-negative');
    }

    if (data.interestRate > 50) {
      errors.push('Interest rate seems unreasonably high (>50%)');
    }

    if (data.loanTermDays && (data.loanTermDays <= 0 || data.loanTermDays > 7300)) {
      errors.push('Loan term must be between 1 and 7300 days');
    }

    if (data.totalFees && data.totalFees < 0) {
      errors.push('Total fees cannot be negative');
    }

    if (data.totalInterest && data.totalInterest < 0) {
      errors.push('Total interest cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate payment data
   */
  validatePayment(data, loanBalance) {
    const errors = [];

    if (!data.amount || data.amount <= 0) {
      errors.push('Payment amount must be greater than 0');
    }

    if (data.amount > (loanBalance?.totalOutstanding || 0)) {
      errors.push(`Payment amount exceeds outstanding balance (${loanBalance?.totalOutstanding})`);
    }

    if (!data.paymentMethod) {
      errors.push('Payment method is required');
    }

    const validMethods = ['bank_transfer', 'cash', 'check', 'online', 'mobile_money'];
    if (data.paymentMethod && !validMethods.includes(data.paymentMethod)) {
      errors.push(`Invalid payment method. Valid methods: ${validMethods.join(', ')}`);
    }

    if (data.referenceNumber && data.referenceNumber.length > 50) {
      errors.push('Reference number cannot exceed 50 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate interest rate configuration
   */
  validateInterestRateConfig(data) {
    const errors = [];

    if (!data.rateType) {
      errors.push('Rate type is required');
    }

    const validRateTypes = ['fixed', 'variable', 'declining', 'flat', 'compound'];
    if (data.rateType && !validRateTypes.includes(data.rateType)) {
      errors.push(`Invalid rate type. Valid types: ${validRateTypes.join(', ')}`);
    }

    if (data.baseRate === undefined || data.baseRate < 0) {
      errors.push('Base rate must be non-negative');
    }

    if (data.baseRate > 50) {
      errors.push('Base rate seems unreasonably high (>50%)');
    }

    if (data.minRate !== undefined && data.maxRate !== undefined && data.minRate > data.maxRate) {
      errors.push('Minimum rate cannot exceed maximum rate');
    }

    if (!data.rateName || data.rateName.trim() === '') {
      errors.push('Rate name is required');
    }

    if (!data.calculationMethod) {
      errors.push('Calculation method is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate payment schedule configuration
   */
  validatePaymentScheduleConfig(data) {
    const errors = [];

    if (!data.frequency) {
      errors.push('Payment frequency is required');
    }

    const validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'custom'];
    if (data.frequency && !validFrequencies.includes(data.frequency)) {
      errors.push(`Invalid frequency. Valid frequencies: ${validFrequencies.join(', ')}`);
    }

    if (!data.scheduleType) {
      errors.push('Schedule type is required');
    }

    const validScheduleTypes = ['fixed', 'flexible'];
    if (data.scheduleType && !validScheduleTypes.includes(data.scheduleType)) {
      errors.push(`Invalid schedule type. Valid types: ${validScheduleTypes.join(', ')}`);
    }

    if (!data.scheduleName || data.scheduleName.trim() === '') {
      errors.push('Schedule name is required');
    }

    if (data.minPaymentPercentage !== undefined && (data.minPaymentPercentage < 0 || data.minPaymentPercentage > 100)) {
      errors.push('Minimum payment percentage must be between 0 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate fee configuration
   */
  validateFeeConfig(data) {
    const errors = [];

    if (!data.feeType) {
      errors.push('Fee type is required');
    }

    const validFeeTypes = ['origination', 'processing', 'late_payment', 'early_settlement', 'modification'];
    if (data.feeType && !validFeeTypes.includes(data.feeType)) {
      errors.push(`Invalid fee type. Valid types: ${validFeeTypes.join(', ')}`);
    }

    if (!data.feeName || data.feeName.trim() === '') {
      errors.push('Fee name is required');
    }

    if (data.feeAmount === undefined && data.feePercentage === undefined) {
      errors.push('Either fee amount or fee percentage must be provided');
    }

    if (data.feeAmount !== undefined && data.feeAmount < 0) {
      errors.push('Fee amount cannot be negative');
    }

    if (data.feePercentage !== undefined && (data.feePercentage < 0 || data.feePercentage > 100)) {
      errors.push('Fee percentage must be between 0 and 100');
    }

    if (!data.calculationBasis) {
      errors.push('Calculation basis is required');
    }

    const validBases = ['principal', 'total_amount', 'flat'];
    if (data.calculationBasis && !validBases.includes(data.calculationBasis)) {
      errors.push(`Invalid calculation basis. Valid bases: ${validBases.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate approval rule configuration
   */
  validateApprovalRuleConfig(data) {
    const errors = [];

    if (data.approvalLevel === undefined) {
      errors.push('Approval level is required');
    }

    if (data.approvalLevel < 1 || data.approvalLevel > 10) {
      errors.push('Approval level must be between 1 and 10');
    }

    if (!data.ruleName || data.ruleName.trim() === '') {
      errors.push('Rule name is required');
    }

    if (data.loanAmountMax && data.loanAmountMin && data.loanAmountMin > data.loanAmountMax) {
      errors.push('Minimum loan amount cannot exceed maximum');
    }

    if (data.creditScoreMin !== undefined && (data.creditScoreMin < 0 || data.creditScoreMin > 1000)) {
      errors.push('Credit score minimum must be between 0 and 1000');
    }

    if (data.maxApprovalDays && data.maxApprovalDays <= 0) {
      errors.push('Maximum approval days must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate loan modification data
   */
  validateLoanModification(data) {
    const errors = [];

    if (!data.modificationType) {
      errors.push('Modification type is required');
    }

    const validTypes = ['term_extension', 'payment_adjustment', 'restructuring', 'refinancing'];
    if (data.modificationType && !validTypes.includes(data.modificationType)) {
      errors.push(`Invalid modification type. Valid types: ${validTypes.join(', ')}`);
    }

    if (!data.modificationName || data.modificationName.trim() === '') {
      errors.push('Modification name is required');
    }

    if (!data.reason || data.reason.trim() === '') {
      errors.push('Modification reason is required');
    }

    if (data.newTermDays && data.newTermDays <= 0) {
      errors.push('New term days must be greater than 0');
    }

    if (data.newMonthlyPayment && data.newMonthlyPayment <= 0) {
      errors.push('New monthly payment must be greater than 0');
    }

    if (data.newInterestRate !== undefined && (data.newInterestRate < 0 || data.newInterestRate > 50)) {
      errors.push('New interest rate must be between 0 and 50');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate disbursement data
   */
  validateDisbursement(data) {
    const errors = [];

    if (!data.disbursedBy) {
      errors.push('Disbursement authorized by is required');
    }

    if (data.amount && data.amount <= 0) {
      errors.push('Disbursement amount must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Log validation errors
   */
  logValidationErrors(errors, context = '') {
    if (errors.length > 0) {
      logger.warn(`❌ Validation errors in ${context}:`, errors);
    }
  }
}

module.exports = new MoneyloanValidators();
