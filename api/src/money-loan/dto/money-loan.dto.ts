import {
  IsNumber,
  IsString,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsEnum,
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

  @IsNumber()
  @IsNotEmpty()
  totalInterest: number;

  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

  @IsNumber()
  @IsNotEmpty()
  processingFee: number;

  @IsNumber()
  @IsNotEmpty()
  platformFee: number;

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
