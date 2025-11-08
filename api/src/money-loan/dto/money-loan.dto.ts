import {
  IsNumber,
  IsString,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsEnum,
  IsDateString,
  Min,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum LoanInterestType {
  FLAT = 'flat',
  REDUCING = 'reducing',
  COMPOUND = 'compound',
}

export enum LoanTermType {
  FIXED = 'fixed',
  FLEXIBLE = 'flexible',
}

export enum PaymentFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

export class CreateLoanProductDto {
  @IsString()
  @IsNotEmpty()
  productCode: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  minAmount: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  maxAmount: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  interestRate: number;

  @IsEnum(LoanInterestType)
  @IsOptional()
  interestType?: LoanInterestType;

  @IsEnum(LoanTermType)
  @IsOptional()
  loanTermType?: LoanTermType;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  fixedTermDays?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minTermDays?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxTermDays?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  processingFeePercent?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  platformFee?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  latePaymentPenaltyPercent?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  gracePeriodDays?: number;

  @IsEnum(PaymentFrequency)
  @IsOptional()
  paymentFrequency?: PaymentFrequency;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  deductPlatformFeeInAdvance?: boolean;

  @IsBoolean()
  @IsOptional()
  deductProcessingFeeInAdvance?: boolean;

  @IsBoolean()
  @IsOptional()
  deductInterestInAdvance?: boolean;

  @IsString()
  @IsOptional()
  availabilityType?: 'all' | 'selected';

  @IsArray()
  @IsOptional()
  @Type(() => Number)
  selectedCustomerIds?: number[];
}

export class UpdateLoanProductDto {
  @IsString()
  @IsOptional()
  productCode?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minAmount?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxAmount?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  interestRate?: number;

  @IsEnum(LoanInterestType)
  @IsOptional()
  interestType?: LoanInterestType;

  @IsEnum(LoanTermType)
  @IsOptional()
  loanTermType?: LoanTermType;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  fixedTermDays?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minTermDays?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxTermDays?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  processingFeePercent?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  platformFee?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  latePaymentPenaltyPercent?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  gracePeriodDays?: number;

  @IsEnum(PaymentFrequency)
  @IsOptional()
  paymentFrequency?: PaymentFrequency;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  deductPlatformFeeInAdvance?: boolean;

  @IsBoolean()
  @IsOptional()
  deductProcessingFeeInAdvance?: boolean;

  @IsBoolean()
  @IsOptional()
  deductInterestInAdvance?: boolean;

  @IsString()
  @IsOptional()
  availabilityType?: 'all' | 'selected';

  @IsArray()
  @IsOptional()
  @Type(() => Number)
  selectedCustomerIds?: number[];
}

export class CreateLoanApplicationDto {
  @IsNumber()
  @IsNotEmpty()
  customerId: number;

  @IsNumber()
  @IsNotEmpty()
  loanProductId: number;

  @IsNumber()
  @IsNotEmpty()
  requestedAmount: number;

  @IsNumber()
  @IsNotEmpty()
  requestedTermDays: number;

  @IsString()
  @IsOptional()
  purpose?: string;

  @IsNumber()
  @IsOptional()
  creditScore?: number;

  @IsNumber()
  @IsOptional()
  annualIncome?: number;

  @IsString()
  @IsOptional()
  employmentStatus?: string;

  @IsString()
  @IsOptional()
  collateralDescription?: string;
}

export class ApproveLoanDto {
  @IsNumber()
  @IsNotEmpty()
  approvedAmount: number;

  @IsNumber()
  @IsNotEmpty()
  approvedTermDays: number;

  @IsNumber()
  @IsNotEmpty()
  interestRate: number;

  @IsString()
  @IsNotEmpty()
  interestType: string;

  // The following fields are now calculated by backend and optional from frontend
  @IsNumber()
  @IsOptional()
  totalInterest?: number;

  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsNumber()
  @IsOptional()
  processingFee?: number;

  @IsNumber()
  @IsOptional()
  platformFee?: number;

  @IsString()
  @IsOptional()
  paymentFrequency?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class DisburseLoanDto {
  @IsString()
  @IsNotEmpty()
  disbursementMethod: string;

  @IsString()
  @IsOptional()
  disbursementReference?: string;

  @IsString()
  @IsOptional()
  disbursementNotes?: string;
}

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  loanId: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class LoanCalculationRequestDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  loanAmount: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  termMonths: number;

  @IsEnum(PaymentFrequency)
  paymentFrequency: PaymentFrequency;

  @Type(() => Number)
  @IsNumber()
  interestRate: number;

  @IsEnum(LoanInterestType)
  interestType: LoanInterestType;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  processingFeePercentage?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  platformFee?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  latePenaltyPercentage?: number;

  @IsDateString()
  @IsOptional()
  disbursementDate?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  deductPlatformFeeInAdvance?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  deductProcessingFeeInAdvance?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  deductInterestInAdvance?: boolean;
}

export class PenaltyCalculationRequestDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  installmentAmount: number;

  @IsDateString()
  dueDate: string;

  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @IsEnum(PaymentFrequency)
  paymentFrequency: PaymentFrequency;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  latePenaltyPercentage: number;
}
