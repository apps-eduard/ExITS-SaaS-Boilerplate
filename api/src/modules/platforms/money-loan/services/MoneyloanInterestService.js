/**
 * Money Loan - Interest Rate Calculation Service
 * Handles all interest calculations: fixed, variable, declining, flat, compound
 */

const logger = require('../../../../utils/logger');

class MoneyloanInterestService {
  /**
   * Calculate interest based on rate type
   * @param {number} principal - Principal amount
   * @param {number} rate - Interest rate (as percentage, e.g., 12 for 12%)
   * @param {number} days - Number of days
   * @param {string} rateType - Type: 'fixed', 'variable', 'declining', 'flat', 'compound'
   * @param {object} additionalParams - Additional parameters based on calculation method
   */
  calculateInterest(principal, rate, days, rateType, additionalParams = {}) {
    try {
      switch (rateType) {
        case 'fixed':
          return this.calculateFixedInterest(principal, rate, days, additionalParams);
        case 'variable':
          return this.calculateVariableInterest(principal, rate, days, additionalParams);
        case 'declining':
          return this.calculateDecliningInterest(principal, rate, days, additionalParams);
        case 'flat':
          return this.calculateFlatInterest(principal, rate, days, additionalParams);
        case 'compound':
          return this.calculateCompoundInterest(principal, rate, days, additionalParams);
        default:
          throw new Error(`Unknown interest rate type: ${rateType}`);
      }
    } catch (error) {
      logger.error(`❌ Error calculating ${rateType} interest:`, error);
      throw error;
    }
  }

  /**
   * Fixed Interest: Simple interest calculation
   * Formula: Interest = (Principal × Rate × Time) / 100
   * Rate is annual, converted to daily
   */
  calculateFixedInterest(principal, annualRate, days, params = {}) {
    const dailyRate = annualRate / 365 / 100;
    const interest = principal * dailyRate * days;

    return {
      type: 'fixed',
      principal,
      annualRate,
      days,
      dailyRate: dailyRate * 100,
      totalInterest: Math.round(interest * 100) / 100,
      totalAmount: Math.round((principal + interest) * 100) / 100,
    };
  }

  /**
   * Variable Interest: Rate changes based on market/predefined tiers
   * Supports tier-based rates (e.g., first 30 days at 8%, next 30 days at 10%)
   */
  calculateVariableInterest(principal, baseRate, totalDays, params = {}) {
    const tiers = params.tiers || []; // Array of {days: number, rate: number}
    let totalInterest = 0;
    let daysProcessed = 0;
    const breakdown = [];

    if (tiers.length === 0) {
      return this.calculateFixedInterest(principal, baseRate, totalDays, params);
    }

    for (const tier of tiers) {
      if (daysProcessed >= totalDays) break;

      const daysInTier = Math.min(tier.days, totalDays - daysProcessed);
      const tierInterest = this.calculateFixedInterest(principal, tier.rate, daysInTier).totalInterest;

      totalInterest += tierInterest;
      breakdown.push({
        tier: breakdown.length + 1,
        days: daysInTier,
        rate: tier.rate,
        interest: Math.round(tierInterest * 100) / 100,
      });

      daysProcessed += daysInTier;
    }

    return {
      type: 'variable',
      principal,
      baseRate,
      totalDays,
      tierBreakdown: breakdown,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalAmount: Math.round((principal + totalInterest) * 100) / 100,
    };
  }

  /**
   * Declining Interest: Interest calculated on remaining balance
   * Used for loans with monthly/periodic payments
   */
  calculateDecliningInterest(principal, annualRate, days, params = {}) {
    const monthlyPayments = params.monthlyPayments || 1;
    const paymentFrequency = params.paymentFrequency || 'monthly'; // daily, weekly, monthly

    let balance = principal;
    let totalInterest = 0;
    const schedule = [];

    const daysPerPeriod = this.getDaysPerPeriod(paymentFrequency);
    const periodsInLoan = Math.ceil(days / daysPerPeriod);

    const dailyRate = annualRate / 365 / 100;

    for (let i = 0; i < periodsInLoan; i++) {
      const periodDays = i === periodsInLoan - 1 ? days - i * daysPerPeriod : daysPerPeriod;
      const periodInterest = balance * dailyRate * periodDays;
      const periodPayment = principal / monthlyPayments;

      totalInterest += periodInterest;
      balance = Math.max(0, balance - periodPayment);

      schedule.push({
        period: i + 1,
        beginningBalance: Math.round(balance * 100) / 100,
        interestCharged: Math.round(periodInterest * 100) / 100,
        payment: Math.round(periodPayment * 100) / 100,
        endingBalance: Math.round(balance * 100) / 100,
      });
    }

    return {
      type: 'declining',
      principal,
      annualRate,
      totalDays: days,
      paymentFrequency,
      monthlyPayments,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalAmount: Math.round((principal + totalInterest) * 100) / 100,
      paymentSchedule: schedule,
    };
  }

  /**
   * Flat Interest: Simple fixed percentage applied to principal
   * Formula: Interest = Principal × (Rate / 100)
   * No time component - fixed percentage
   */
  calculateFlatInterest(principal, ratePercentage, days, params = {}) {
    const interest = principal * (ratePercentage / 100);

    return {
      type: 'flat',
      principal,
      ratePercentage,
      days,
      totalInterest: Math.round(interest * 100) / 100,
      totalAmount: Math.round((principal + interest) * 100) / 100,
      note: 'Flat rate - independent of loan duration',
    };
  }

  /**
   * Compound Interest: Interest compounded periodically
   * Formula: A = P(1 + r/n)^(nt)
   * where: P = principal, r = annual rate, n = compounding periods per year, t = time in years
   */
  calculateCompoundInterest(principal, annualRate, days, params = {}) {
    const compoundingFrequency = params.compoundingFrequency || 'annually'; // daily, monthly, quarterly, annually
    const n = this.getCompoundingPeriodsPerYear(compoundingFrequency);
    const t = days / 365;
    const r = annualRate / 100;

    const amount = principal * Math.pow(1 + r / n, n * t);
    const interest = amount - principal;

    return {
      type: 'compound',
      principal,
      annualRate,
      compoundingFrequency,
      days,
      compoundingPeriodsPerYear: n,
      totalInterest: Math.round(interest * 100) / 100,
      totalAmount: Math.round(amount * 100) / 100,
    };
  }

  /**
   * Calculate EMI (Equated Monthly Installment)
   * Used for fixed monthly payments
   */
  calculateEMI(principal, annualRate, monthlyPayments) {
    const monthlyRate = annualRate / 12 / 100;

    if (monthlyRate === 0) {
      return Math.round((principal / monthlyPayments) * 100) / 100;
    }

    const numerator = monthlyRate * Math.pow(1 + monthlyRate, monthlyPayments);
    const denominator = Math.pow(1 + monthlyRate, monthlyPayments) - 1;
    const emi = principal * (numerator / denominator);

    return Math.round(emi * 100) / 100;
  }

  /**
   * Calculate total payable amount and break down
   */
  calculateTotalPayable(principal, annualRate, monthlyPayments, rateType = 'fixed') {
    const emi = this.calculateEMI(principal, annualRate, monthlyPayments);
    const totalPayable = emi * monthlyPayments;
    const totalInterest = totalPayable - principal;

    return {
      principal: Math.round(principal * 100) / 100,
      annualRate,
      monthlyPayments,
      emiPerMonth: emi,
      totalPayable: Math.round(totalPayable * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      rateType,
    };
  }

  /**
   * Helper: Get days per period
   */
  getDaysPerPeriod(frequency) {
    const frequencyMap = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      quarterly: 90,
      yearly: 365,
    };

    return frequencyMap[frequency] || 30;
  }

  /**
   * Helper: Get compounding periods per year
   */
  getCompoundingPeriodsPerYear(frequency) {
    const frequencyMap = {
      daily: 365,
      weekly: 52,
      monthly: 12,
      quarterly: 4,
      annually: 1,
    };

    return frequencyMap[frequency] || 1;
  }

  /**
   * Validate interest rate configuration
   */
  validateInterestRate(rate, minRate, maxRate) {
    const errors = [];

    if (!rate || isNaN(rate)) {
      errors.push('Rate must be a valid number');
    }

    if (minRate && rate < minRate) {
      errors.push(`Rate (${rate}%) cannot be below minimum (${minRate}%)`);
    }

    if (maxRate && rate > maxRate) {
      errors.push(`Rate (${rate}%) cannot exceed maximum (${maxRate}%)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate effective annual rate (considering compounding)
   */
  calculateEffectiveAnnualRate(nominalRate, compoundingFrequency) {
    const n = this.getCompoundingPeriodsPerYear(compoundingFrequency);
    const r = nominalRate / 100;

    const effectiveRate = Math.pow(1 + r / n, n) - 1;

    return {
      nominalRate,
      compoundingFrequency,
      effectiveAnnualRate: Math.round(effectiveRate * 10000) / 100,
    };
  }
}

module.exports = new MoneyloanInterestService();
