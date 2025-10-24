/**
 * Loan Calculator Utility
 * Handles all loan-related calculations
 */

class LoanCalculator {
  /**
   * Calculate total interest based on interest type
   * @param {number} principal - Loan principal amount
   * @param {number} interestRate - Annual interest rate (percentage)
   * @param {number} termDays - Loan term in days
   * @param {string} interestType - Type: 'flat', 'reducing', 'compound'
   * @returns {number} Total interest amount
   */
  static calculateInterest(principal, interestRate, termDays, interestType = 'reducing') {
    const rate = interestRate / 100;
    const years = termDays / 365;

    switch (interestType) {
      case 'flat':
        return principal * rate * years;

      case 'reducing':
        // Reducing balance (amortized)
        const monthlyRate = rate / 12;
        const months = termDays / 30;
        const monthlyPayment = this.calculateMonthlyPayment(principal, interestRate, termDays);
        return (monthlyPayment * months) - principal;

      case 'compound':
        return principal * (Math.pow(1 + rate, years) - 1);

      default:
        return principal * rate * years;
    }
  }

  /**
   * Calculate monthly payment for reducing balance loan
   * @param {number} principal - Loan principal amount
   * @param {number} annualRate - Annual interest rate (percentage)
   * @param {number} termDays - Loan term in days
   * @returns {number} Monthly payment amount
   */
  static calculateMonthlyPayment(principal, annualRate, termDays) {
    const monthlyRate = (annualRate / 100) / 12;
    const months = termDays / 30;

    if (monthlyRate === 0) {
      return principal / months;
    }

    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
                    (Math.pow(1 + monthlyRate, months) - 1);

    return Math.round(payment * 100) / 100;
  }

  /**
   * Calculate total loan amount
   * @param {number} principal - Loan principal
   * @param {number} interest - Total interest
   * @param {number} processingFee - Processing fee amount
   * @returns {number} Total amount to be repaid
   */
  static calculateTotalAmount(principal, interest, processingFee = 0) {
    return principal + interest + processingFee;
  }

  /**
   * Calculate processing fee
   * @param {number} principal - Loan principal
   * @param {number} feePercent - Processing fee percentage
   * @returns {number} Processing fee amount
   */
  static calculateProcessingFee(principal, feePercent) {
    return (principal * feePercent) / 100;
  }

  /**
   * Generate repayment schedule
   * @param {object} loanData - Loan details
   * @returns {array} Array of repayment installments
   */
  static generateRepaymentSchedule(loanData) {
    const {
      principalAmount,
      interestRate,
      termDays,
      interestType,
      disbursementDate,
      paymentFrequency = 'monthly' // monthly, weekly, bi-weekly
    } = loanData;

    const schedule = [];
    const totalInterest = this.calculateInterest(principalAmount, interestRate, termDays, interestType);
    
    // Calculate payment frequency
    let frequencyDays;
    let numberOfPayments;
    
    switch (paymentFrequency) {
      case 'weekly':
        frequencyDays = 7;
        numberOfPayments = Math.ceil(termDays / 7);
        break;
      case 'bi-weekly':
        frequencyDays = 14;
        numberOfPayments = Math.ceil(termDays / 14);
        break;
      case 'monthly':
      default:
        frequencyDays = 30;
        numberOfPayments = Math.ceil(termDays / 30);
    }

    const paymentAmount = this.calculateMonthlyPayment(principalAmount, interestRate, termDays);
    let remainingPrincipal = principalAmount;
    let currentDate = new Date(disbursementDate);

    for (let i = 1; i <= numberOfPayments; i++) {
      // Calculate due date
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + frequencyDays);

      // Calculate interest for this period
      const periodInterest = (remainingPrincipal * (interestRate / 100)) / (365 / frequencyDays);
      
      // Calculate principal for this period
      const periodPrincipal = paymentAmount - periodInterest;

      // Last payment adjustment
      const isLastPayment = i === numberOfPayments;
      const adjustedPrincipal = isLastPayment ? remainingPrincipal : Math.min(periodPrincipal, remainingPrincipal);
      const adjustedInterest = isLastPayment ? 
        (principalAmount + totalInterest) - schedule.reduce((sum, s) => sum + s.totalAmount, 0) - adjustedPrincipal :
        periodInterest;

      const installment = {
        installmentNumber: i,
        dueDate: currentDate.toISOString().split('T')[0],
        principalAmount: Math.round(adjustedPrincipal * 100) / 100,
        interestAmount: Math.round(adjustedInterest * 100) / 100,
        totalAmount: Math.round((adjustedPrincipal + adjustedInterest) * 100) / 100,
        outstandingAmount: Math.round((adjustedPrincipal + adjustedInterest) * 100) / 100,
        amountPaid: 0,
        penaltyAmount: 0,
        status: 'pending'
      };

      schedule.push(installment);
      remainingPrincipal -= adjustedPrincipal;
    }

    return schedule;
  }

  /**
   * Calculate late payment penalty
   * @param {number} overdueAmount - Amount that is overdue
   * @param {number} daysOverdue - Number of days overdue
   * @param {number} penaltyRate - Daily penalty rate (percentage)
   * @param {number} gracePeriod - Grace period days
   * @returns {number} Penalty amount
   */
  static calculatePenalty(overdueAmount, daysOverdue, penaltyRate, gracePeriod = 0) {
    if (daysOverdue <= gracePeriod) {
      return 0;
    }

    const applicableDays = daysOverdue - gracePeriod;
    return (overdueAmount * (penaltyRate / 100) * applicableDays) / 30;
  }

  /**
   * Calculate early payoff amount
   * @param {number} outstandingPrincipal - Remaining principal
   * @param {number} outstandingInterest - Remaining interest
   * @param {number} earlyPayoffDiscount - Discount percentage for early payoff
   * @returns {object} Payoff details
   */
  static calculateEarlyPayoff(outstandingPrincipal, outstandingInterest, earlyPayoffDiscount = 0) {
    const totalOutstanding = outstandingPrincipal + outstandingInterest;
    const discountAmount = (outstandingInterest * earlyPayoffDiscount) / 100;
    const payoffAmount = totalOutstanding - discountAmount;

    return {
      outstandingPrincipal,
      outstandingInterest,
      totalOutstanding,
      discountAmount,
      payoffAmount,
      savings: discountAmount
    };
  }

  /**
   * Calculate loan affordability/eligibility
   * @param {number} monthlyIncome - Customer's monthly income
   * @param {number} monthlyPayment - Required monthly payment
   * @param {number} maxDtiRatio - Maximum debt-to-income ratio (percentage)
   * @returns {object} Affordability analysis
   */
  static calculateAffordability(monthlyIncome, monthlyPayment, maxDtiRatio = 40) {
    const dtiRatio = (monthlyPayment / monthlyIncome) * 100;
    const isAffordable = dtiRatio <= maxDtiRatio;
    const maxAffordablePayment = (monthlyIncome * maxDtiRatio) / 100;

    return {
      monthlyIncome,
      monthlyPayment,
      dtiRatio: Math.round(dtiRatio * 100) / 100,
      maxDtiRatio,
      isAffordable,
      maxAffordablePayment: Math.round(maxAffordablePayment * 100) / 100,
      disposableIncome: monthlyIncome - monthlyPayment
    };
  }
}

module.exports = LoanCalculator;
