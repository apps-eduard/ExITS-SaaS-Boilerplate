export interface LoanCalculationRequest {
  loanAmount: number;
  termMonths: number;
  paymentFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  interestRate: number;
  interestType: 'flat' | 'reducing' | 'compound';
  processingFeePercentage?: number;
  platformFee?: number;
  latePenaltyPercentage?: number;
  disbursementDate?: string;
}

export interface LoanCalculationResult {
  loanAmount: number;
  termMonths: number;
  paymentFrequency: string;
  interestAmount: number;
  processingFeeAmount: number;
  platformFee: number;
  netProceeds: number;
  totalRepayable: number;
  numPayments: number;
  installmentAmount: number;
  effectiveInterestRate: number;
  gracePeriodDays: number;
  totalDeductions: number;
  monthlyEquivalent?: number;
}

export interface LoanSchedulePreviewItem {
  paymentNumber: number;
  dueDate: string | Date;
  installmentAmount: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  cumulativePaid: number;
}

export interface LoanCalculationPreview {
  calculation: LoanCalculationResult;
  schedule: LoanSchedulePreviewItem[];
}
