import { Injectable } from '@nestjs/common';

export interface LoanCalculationParams {
  loanAmount: number;
  termDays: number;
  interestRate: number;
  interestType: 'flat' | 'reducing' | 'compound';
  processingFeePercent?: number;
  platformFee?: number;
}

export interface LoanCalculationResult {
  principalAmount: number;
  interestAmount: number;
  processingFee: number;
  platformFee: number;
  totalAmount: number;
  totalRepayable: number;
  netProceeds: number;
  outstandingBalance: number;
}

@Injectable()
export class LoanCalculatorService {
  /**
   * Calculate loan amounts based on interest type
   */
  calculate(params: LoanCalculationParams): LoanCalculationResult {
    const {
      loanAmount,
      termDays,
      interestRate,
      interestType,
      processingFeePercent = 0,
      platformFee = 0,
    } = params;

    // Calculate interest based on type
    let interestAmount: number;
    if (interestType === 'flat') {
      interestAmount = this.calculateFlatInterest(loanAmount, interestRate, termDays);
    } else if (interestType === 'reducing') {
      interestAmount = this.calculateReducingInterest(loanAmount, interestRate, termDays);
    } else if (interestType === 'compound') {
      interestAmount = this.calculateCompoundInterest(loanAmount, interestRate, termDays);
    } else {
      // Default to flat if unknown type
      interestAmount = this.calculateFlatInterest(loanAmount, interestRate, termDays);
    }

    // Processing fee (percentage of principal)
    const processingFee = loanAmount * (processingFeePercent / 100);

    // Total amount = principal + interest
    const totalAmount = loanAmount + interestAmount;

    // Total repayable = principal + interest + platform fees
    const totalRepayable = totalAmount + platformFee;

    // Net proceeds = what borrower receives (principal - upfront fees)
    const netProceeds = loanAmount - processingFee - platformFee;

    // Outstanding balance starts at total amount
    const outstandingBalance = totalAmount;

    return {
      principalAmount: loanAmount,
      interestAmount: Math.round(interestAmount * 100) / 100, // Round to 2 decimals
      processingFee: Math.round(processingFee * 100) / 100,
      platformFee,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalRepayable: Math.round(totalRepayable * 100) / 100,
      netProceeds: Math.round(netProceeds * 100) / 100,
      outstandingBalance: Math.round(outstandingBalance * 100) / 100,
    };
  }

  /**
   * Flat interest: Simple interest calculated once on principal
   * Formula: Principal × Rate × (Days / 365) / 100
   */
  private calculateFlatInterest(
    principal: number,
    ratePercent: number,
    termDays: number,
  ): number {
    return (principal * ratePercent * termDays) / (365 * 100);
  }

  /**
   * Reducing balance: Interest calculated on remaining balance
   * Simplified version using average balance method
   */
  private calculateReducingInterest(
    principal: number,
    ratePercent: number,
    termDays: number,
  ): number {
    // Average balance = (Principal + 0) / 2
    const averageBalance = principal / 2;
    return (averageBalance * ratePercent * termDays) / (365 * 100);
  }

  /**
   * Compound interest: Interest on interest
   * Formula: Principal × ((1 + Rate)^(Days/365) - 1)
   */
  private calculateCompoundInterest(
    principal: number,
    ratePercent: number,
    termDays: number,
  ): number {
    const rate = ratePercent / 100;
    const years = termDays / 365;
    const compounded = principal * (Math.pow(1 + rate, years) - 1);
    return compounded;
  }

  /**
   * Calculate monthly payment for amortized loans
   */
  calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    termMonths: number,
  ): number {
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) return principal / termMonths;

    const payment =
      principal *
      (monthlyRate / (1 - Math.pow(1 + monthlyRate, -termMonths)));
    return Math.round(payment * 100) / 100;
  }

  /**
   * Calculate late payment penalty
   */
  calculatePenalty(
    installmentAmount: number,
    daysLate: number,
    penaltyRatePercent: number,
    gracePeriodDays: number = 0,
  ): number {
    const effectiveDaysLate = Math.max(0, daysLate - gracePeriodDays);
    const penalty =
      installmentAmount * (penaltyRatePercent / 100) * effectiveDaysLate;
    return Math.round(penalty * 100) / 100;
  }
}
