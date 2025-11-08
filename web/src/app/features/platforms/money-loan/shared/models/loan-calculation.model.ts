export type PaymentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type LoanInterestType = 'flat' | 'reducing' | 'compound';

export interface LoanCalculationRequest {
  loanAmount: number;
  termMonths: number;
  paymentFrequency: PaymentFrequency;
  interestRate: number;
  interestType: LoanInterestType;
  processingFeePercentage?: number;
  platformFee?: number;
  latePenaltyPercentage?: number;
  disbursementDate?: string;
  deductPlatformFeeInAdvance?: boolean;
  deductProcessingFeeInAdvance?: boolean;
  deductInterestInAdvance?: boolean;
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
