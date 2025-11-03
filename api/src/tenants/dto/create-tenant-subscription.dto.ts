import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

const BILLING_CYCLES = ['monthly', 'quarterly', 'yearly', 'one_time'] as const;

export class CreateTenantSubscriptionDto {
  @IsNumber()
  @IsPositive()
  planId!: number;

  @IsEnum(BILLING_CYCLES)
  @IsOptional()
  billingCycle?: typeof BILLING_CYCLES[number];

  @IsString()
  @IsOptional()
  paymentMethod?: string;
}
