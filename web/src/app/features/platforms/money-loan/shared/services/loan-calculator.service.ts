import { Injectable } from '@angular/core';

export interface LoanParams {
  loanAmount: number;
  termMonths: number;
  paymentFrequency: 'daily' | 'weekly' | 'monthly';
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

    // Calculate number of payments based on frequency
    const numPayments = this.calculateNumPayments(termMonths, paymentFrequency);

    // Calculate interest based on type
    let interestAmount: number;
    if (interestType === 'flat') {
      interestAmount = this.calculateFlatInterest(loanAmount, interestRate);
    } else if (interestType === 'reducing') {
      interestAmount = this.calculateReducingInterest(loanAmount, interestRate, numPayments);
    } else {
      interestAmount = this.calculateCompoundInterest(loanAmount, interestRate, termMonths);
    }

    // Processing fee calculation
    const processingFeeAmount = loanAmount * (processingFeePercentage / 100);

    // Total repayable (for flat: principal only, for reducing: calculated differently)
    const totalRepayable = interestType === 'flat' 
      ? loanAmount // In flat with pre-deducted interest, we only repay principal
      : loanAmount + interestAmount;

    // Net proceeds = what borrower actually receives
    const netProceeds = loanAmount - interestAmount - processingFeeAmount - platformFee;

    // Installment amount
    const installmentAmount = totalRepayable / numPayments;

    // Effective interest rate (APR)
    const effectiveInterestRate = this.calculateEffectiveRate(
      netProceeds,
      totalRepayable,
      termMonths
    );

    // Grace period based on frequency
    const gracePeriodDays = this.getGracePeriod(paymentFrequency);

    // Total deductions
    const totalDeductions = interestAmount + processingFeeAmount + platformFee;

    // Monthly equivalent (for comparison)
    const monthlyEquivalent = paymentFrequency === 'monthly' 
      ? installmentAmount 
      : this.convertToMonthlyEquivalent(installmentAmount, paymentFrequency);

    return {
      loanAmount,
      termMonths,
      paymentFrequency,
      interestAmount,
      processingFeeAmount,
      platformFee,
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
    const multipliers = {
      daily: 30,
      weekly: 4,
      monthly: 1
    };
    return termMonths * (multipliers[frequency as keyof typeof multipliers] || 1);
  }

  /**
   * Flat interest: calculated once on principal
   */
  private calculateFlatInterest(principal: number, rate: number): number {
    return principal * (rate / 100);
  }

  /**
   * Reducing balance: interest calculated on remaining balance
   */
  private calculateReducingInterest(principal: number, annualRate: number, numPayments: number): number {
    // This is simplified - actual reducing balance is more complex
    // For now, return approximate total interest
    const monthlyRate = annualRate / 12 / 100;
    const totalInterest = principal * monthlyRate * numPayments * 0.5; // Approximate
    return totalInterest;
  }

  /**
   * Compound interest: interest on interest
   */
  private calculateCompoundInterest(principal: number, rate: number, termMonths: number): number {
    const compoundRate = 1 + (rate / 100);
    const compounded = principal * Math.pow(compoundRate, termMonths / 12);
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
    const multipliers = {
      daily: 30,
      weekly: 4,
      monthly: 1
    };
    return installment * (multipliers[frequency as keyof typeof multipliers] || 1);
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
      const principal = installment; // For flat interest, all installment is principal
      const interest = 0; // Interest already deducted upfront

      remainingBalance -= principal;
      cumulativePaid += installment;

      schedule.push({
        paymentNumber: i,
        dueDate,
        installmentAmount: installment,
        principal,
        interest,
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
