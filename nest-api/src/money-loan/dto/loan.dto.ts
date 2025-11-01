import { IsNumber, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
