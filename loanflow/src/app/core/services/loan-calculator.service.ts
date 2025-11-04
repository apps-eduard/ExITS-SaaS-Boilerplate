import { Injectable } from '@angular/core';

export interface LoanCalculationParams {
  loanAmount: number;
  termMonths: number;
  paymentFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  interestRate: number; // monthly percentage
  interestType: 'flat' | 'reducing' | 'compound';
  processingFeePercentage?: number;
  platformFee?: number; // fee per month
  latePenaltyPercentage?: number;
}

export interface LoanCalculationResult {
  loanAmount: number;
  termMonths: number;
  paymentFrequency: string;
  interestAmount: number;
  processingFeeAmount: number;
  platformFee: number; // total for entire term
  netProceeds: number;
  totalRepayable: number;
  numPayments: number;
  installmentAmount: number;
  effectiveInterestRate: number;
  gracePeriodDays: number;
  totalDeductions: number; // upfront fees only
  monthlyEquivalent?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LoanCalculatorService {
  calculate(params: LoanCalculationParams): LoanCalculationResult {
    const {
      loanAmount,
      termMonths,
      paymentFrequency,
      interestRate,
      interestType,
      processingFeePercentage = 0,
      platformFee = 0,
      latePenaltyPercentage = 0
    } = params;

    // 1. Processing Fee = A × (PF / 100)
    const processingFeeAmount = loanAmount * (processingFeePercentage / 100);

    // 2. Platform Fee (Total) = PLF × T
    const platformFeeTotal = platformFee * termMonths;

    // 3. Interest Amount based on type
    const interestAmount = this.computeInterest(loanAmount, interestRate, termMonths, interestType);

    // 4. Total Repayment = A + processingFee + platformFee + interestAmount
    // Customer must repay: principal + all fees + interest
    const totalRepayable = loanAmount + processingFeeAmount + platformFeeTotal + interestAmount;

    // 5. Net Proceeds = A − (processingFeeAmount + platformFeeTotal)
    // What customer actually receives after upfront deductions
    const netProceeds = loanAmount - (processingFeeAmount + platformFeeTotal);

    // 6. Number of Payments
    const numPayments = this.calculateNumPayments(termMonths, paymentFrequency);

    // 7. Installment Amount = totalRepayable / payments
    const installmentAmount = totalRepayable / numPayments;

    // 8. Effective Interest Rate (APR approximation)
    const effectiveRate = netProceeds > 0 
      ? ((totalRepayable - netProceeds) / netProceeds) * (12 / termMonths) * 100
      : 0;

    // Grace Period
    const gracePeriodDays = this.getGracePeriod(paymentFrequency);

    // Total Deductions (upfront)
    const totalDeductions = processingFeeAmount + platformFeeTotal;

    // Monthly Equivalent
    const monthlyEquivalent = this.convertToMonthlyEquivalent(installmentAmount, paymentFrequency);

    return {
      loanAmount,
      termMonths,
      paymentFrequency,
      interestAmount: this.roundToCents(interestAmount),
      processingFeeAmount: this.roundToCents(processingFeeAmount),
      platformFee: this.roundToCents(platformFeeTotal),
      netProceeds: this.roundToCents(netProceeds),
      totalRepayable: this.roundToCents(totalRepayable),
      numPayments,
      installmentAmount: this.roundToCents(installmentAmount),
      effectiveInterestRate: this.roundToCents(effectiveRate),
      gracePeriodDays,
      totalDeductions: this.roundToCents(totalDeductions),
      monthlyEquivalent: this.roundToCents(monthlyEquivalent)
    };
  }

  private calculateNumPayments(termMonths: number, frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'): number {
    switch (frequency) {
      case 'daily':
        return termMonths * 30;
      case 'weekly':
        return termMonths * 4;
      case 'biweekly':
        return Math.ceil((termMonths * 30) / 14);
      case 'monthly':
      default:
        return termMonths;
    }
  }

  private computeInterest(principal: number, monthlyRatePercent: number, termMonths: number, type: LoanCalculationParams['interestType']): number {
    switch (type) {
      case 'reducing':
        return this.calculateReducingInterest(principal, monthlyRatePercent, termMonths);
      case 'compound':
        return this.calculateCompoundInterest(principal, monthlyRatePercent, termMonths);
      case 'flat':
      default:
        return this.calculateFlatInterest(principal, monthlyRatePercent, termMonths);
    }
  }

  // Flat Interest = A × (I / 100) × T
  private calculateFlatInterest(principal: number, monthlyRatePercent: number, termMonths: number): number {
    return principal * (monthlyRatePercent / 100) * termMonths;
  }

  // Reducing Interest (simplified average balance method)
  private calculateReducingInterest(principal: number, monthlyRatePercent: number, termMonths: number): number {
    const averageBalance = principal / 2;
    return averageBalance * (monthlyRatePercent / 100) * termMonths;
  }

  // Compound Interest
  private calculateCompoundInterest(principal: number, monthlyRatePercent: number, termMonths: number): number {
    const monthlyRate = monthlyRatePercent / 100;
    return principal * (Math.pow(1 + monthlyRate, termMonths) - 1);
  }

  getGracePeriod(frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'): number {
    switch (frequency) {
      case 'daily':
        return 0;
      case 'weekly':
        return 1;
      case 'biweekly':
        return 2;
      case 'monthly':
        return 3;
      default:
        return 0;
    }
  }

  convertToMonthlyEquivalent(installment: number, frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'): number {
    switch (frequency) {
      case 'daily':
        return installment * 30;
      case 'weekly':
        return installment * 4;
      case 'biweekly':
        return installment * 2;
      case 'monthly':
      default:
        return installment;
    }
  }

  private roundToCents(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
