import { Injectable } from '@angular/core';

export interface LoanParams {
  loanAmount: number;
  termMonths: number;
  paymentFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  interestRate: number;
  interestType: 'flat' | 'reducing' | 'compound';
  processingFeePercentage: number;
  platformFee: number;
  latePenaltyPercentage: number;
}

export interface LoanCalculation {
  // Input values
  loanAmount: number;
  termMonths: number;
  paymentFrequency: string;
  
  // Calculated values
  interestAmount: number;
  processingFeeAmount: number;
  platformFee: number;
  netProceeds: number;
  totalRepayable: number;
  numPayments: number;
  installmentAmount: number;
  effectiveInterestRate: number;
  
  // Grace period info
  gracePeriodDays: number;
  
  // Summary
  totalDeductions: number;
  monthlyEquivalent?: number;
}

export interface ScheduleItem {
  paymentNumber: number;
  dueDate: Date;
  installmentAmount: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  cumulativePaid: number;
}

export interface PenaltyCalculation {
  installmentAmount: number;
  daysLate: number;
  gracePeriod: number;
  effectiveLateDays: number;
  penaltyRate: number;
  penaltyAmount: number;
  totalDue: number;
}

@Injectable({
  providedIn: 'root'
})
export class LoanCalculatorService {

  /**
   * Main calculation method implementing all formulas from documentation
   */
  calculate(params: LoanParams): LoanCalculation {
    const {
      loanAmount,
      termMonths,
      paymentFrequency,
      interestRate,
      interestType,
      processingFeePercentage,
      platformFee,
      latePenaltyPercentage
    } = params;

    const normalizedTerm = Math.max(1, Math.round(termMonths));

    // Calculate number of payments based on frequency
    const numPayments = this.calculateNumPayments(normalizedTerm, paymentFrequency);

    // Calculate interest based on type (interest rate assumed per month)
    let interestAmount: number;
    if (interestType === 'flat') {
      interestAmount = this.calculateFlatInterest(loanAmount, interestRate, normalizedTerm);
    } else if (interestType === 'reducing') {
      interestAmount = this.calculateReducingInterest(
        loanAmount,
        interestRate,
        normalizedTerm,
        numPayments,
        paymentFrequency
      );
    } else {
      interestAmount = this.calculateCompoundInterest(loanAmount, interestRate, normalizedTerm);
    }

    // Processing fee calculation (percent of principal, collected upfront)
    const processingFeeAmount = loanAmount * (processingFeePercentage / 100);

    // Platform fee is charged per month of the term
    const platformFeeTotal = platformFee * normalizedTerm;

    // Total repayable = principal + earned interest + total platform fees
    const totalRepayable = loanAmount + interestAmount + platformFeeTotal;

    // Net proceeds = what borrower actually receives after upfront fees
    const netProceeds = loanAmount - processingFeeAmount - platformFeeTotal;

    // Installment amount (guard against divide-by-zero)
    const installmentAmount = numPayments > 0 ? totalRepayable / numPayments : 0;

    // Effective interest rate (APR approximation)
    const effectiveInterestRate = this.calculateEffectiveRate(
      netProceeds,
      totalRepayable,
      normalizedTerm
    );

    // Grace period based on frequency
    const gracePeriodDays = this.getGracePeriod(paymentFrequency);

    // Total deductions (upfront only)
    const totalDeductions = processingFeeAmount + platformFeeTotal;

    // Monthly equivalent (for comparison)
    const monthlyEquivalent = paymentFrequency === 'monthly'
      ? installmentAmount
      : this.convertToMonthlyEquivalent(installmentAmount, paymentFrequency);

    return {
      loanAmount,
      termMonths: normalizedTerm,
      paymentFrequency,
      interestAmount,
      processingFeeAmount,
      platformFee: platformFeeTotal,
      netProceeds,
      totalRepayable,
      numPayments,
      installmentAmount,
      effectiveInterestRate,
      gracePeriodDays,
      totalDeductions,
      monthlyEquivalent
    };
  }

  /**
   * Calculate number of payments based on term and frequency
   */
  private calculateNumPayments(termMonths: number, frequency: string): number {
    const roundedTerm = Math.max(0, Math.round(termMonths));
    const termDays = roundedTerm * 30;

    switch (frequency) {
      case 'daily':
        return termDays;
      case 'weekly':
        return roundedTerm * 4;
      case 'biweekly':
        return Math.ceil(termDays / 14);
      case 'monthly':
        return roundedTerm;
      default:
        return roundedTerm * 4;
    }
  }

  /**
   * Flat interest: calculated once on principal
   */
  private calculateFlatInterest(principal: number, ratePercent: number, termMonths: number): number {
    return principal * (ratePercent / 100) * termMonths;
  }

  /**
   * Reducing balance: interest calculated on remaining balance
   */
  private calculateReducingInterest(
    principal: number,
    ratePercent: number,
    termMonths: number,
    numPayments: number,
    frequency: string
  ): number {
    if (numPayments === 0) return 0;

    const paymentsPerMonth = this.getPaymentsPerMonth(frequency);
    const periodicRate = paymentsPerMonth > 0 ? (ratePercent / 100) / paymentsPerMonth : 0;

    if (periodicRate === 0) {
      return principal * (ratePercent / 100) * termMonths;
    }

    const payment = principal * (periodicRate / (1 - Math.pow(1 + periodicRate, -numPayments)));
    const totalPaid = payment * numPayments;
    return totalPaid - principal;
  }

  /**
   * Compound interest: interest on interest
   */
  private calculateCompoundInterest(principal: number, ratePercent: number, termMonths: number): number {
    const monthlyRate = ratePercent / 100;
    const compounded = principal * Math.pow(1 + monthlyRate, termMonths);
    return compounded - principal;
  }

  /**
   * Calculate effective interest rate (APR)
   */
  private calculateEffectiveRate(netProceeds: number, totalRepayable: number, termMonths: number): number {
    if (netProceeds === 0) return 0;
    const totalInterest = totalRepayable - netProceeds;
    const rate = (totalInterest / netProceeds) * (12 / termMonths) * 100;
    return Math.round(rate * 100) / 100; // Round to 2 decimals
  }

  /**
   * Get grace period based on payment frequency
   */
  getGracePeriod(frequency: string): number {
    const gracePeriods = {
      daily: 0,
      weekly: 1,
      monthly: 3
    };
    return gracePeriods[frequency as keyof typeof gracePeriods] || 0;
  }

  /**
   * Convert installment to monthly equivalent
   */
  private convertToMonthlyEquivalent(installment: number, frequency: string): number {
    const multiplier = this.getPaymentsPerMonth(frequency);
    return installment * (multiplier || 1);
  }

  /**
   * Generate repayment schedule
   */
  generateSchedule(calculation: LoanCalculation, startDate: Date): ScheduleItem[] {
    const schedule: ScheduleItem[] = [];
    let remainingBalance = calculation.totalRepayable;
    let cumulativePaid = 0;

    // Calculate days between payments
    const daysBetweenPayments = this.getDaysBetweenPayments(calculation.paymentFrequency);

    for (let i = 1; i <= calculation.numPayments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + (i * daysBetweenPayments));

      const installment = calculation.installmentAmount;
      const principalPortion = calculation.numPayments > 0
        ? calculation.loanAmount / calculation.numPayments
        : 0;
      const interestPortion = Math.max(0, installment - principalPortion);

      remainingBalance -= principalPortion;
      cumulativePaid += installment;

      schedule.push({
        paymentNumber: i,
        dueDate,
        installmentAmount: installment,
        principal: principalPortion,
        interest: interestPortion,
        remainingBalance: Math.max(0, remainingBalance),
        cumulativePaid
      });
    }

    return schedule;
  }

  /**
   * Get days between payments based on frequency
   */
  private getDaysBetweenPayments(frequency: string): number {
    const days = {
      daily: 1,
      weekly: 7,
      monthly: 30
    };
    return days[frequency as keyof typeof days] || 30;
  }

  private getPaymentsPerMonth(frequency: string): number {
    switch (frequency) {
      case 'daily':
        return 30;
      case 'weekly':
        return 4;
      case 'biweekly':
        return 2;
      case 'monthly':
        return 1;
      default:
        return 4;
    }
  }

  /**
   * Calculate penalty for late payment
   */
  calculatePenalty(
    installmentAmount: number,
    dueDate: Date,
    paymentDate: Date,
    frequency: string,
    penaltyRate: number
  ): PenaltyCalculation {
    const gracePeriod = this.getGracePeriod(frequency);
    
    // Calculate days late
    const diffTime = paymentDate.getTime() - dueDate.getTime();
    const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Effective late days after grace period
    const effectiveLateDays = Math.max(0, daysLate - gracePeriod);

    // Penalty calculation: Installment × PenaltyRate% × EffectiveLateDays
    const penaltyAmount = installmentAmount * (penaltyRate / 100) * effectiveLateDays;

    // Total due = installment + penalty
    const totalDue = installmentAmount + penaltyAmount;

    return {
      installmentAmount,
      daysLate,
      gracePeriod,
      effectiveLateDays,
      penaltyRate,
      penaltyAmount,
      totalDue
    };
  }

  /**
   * Calculate early payment settlement amount
   */
  calculateEarlySettlement(
    calculation: LoanCalculation,
    paymentsMade: number,
    currentDate: Date,
    startDate: Date
  ): {
    remainingPrincipal: number;
    interestRebate: number;
    totalDue: number;
    savedInterest: number;
  } {
    const paymentsRemaining = calculation.numPayments - paymentsMade;
    const remainingPrincipal = calculation.installmentAmount * paymentsRemaining;

    // Interest rebate for unused term (pro-rated)
    const interestRebate = (calculation.interestAmount / calculation.numPayments) * paymentsRemaining;

    // Total due for early settlement
    const totalDue = remainingPrincipal - interestRebate;

    return {
      remainingPrincipal,
      interestRebate,
      totalDue,
      savedInterest: interestRebate
    };
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format percentage for display
   */
  formatPercentage(rate: number): string {
    return `${rate.toFixed(2)}%`;
  }
}
