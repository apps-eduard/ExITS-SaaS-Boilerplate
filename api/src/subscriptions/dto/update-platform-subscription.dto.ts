import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

const BILLING_CYCLES = ['monthly', 'quarterly', 'yearly', 'one_time'] as const;

export class UpdatePlatformSubscriptionDto {
  @IsNumber()
  @IsPositive()
  @IsOptional()
  subscriptionPlanId?: number;

  @IsEnum(BILLING_CYCLES)
  @IsOptional()
  billingCycle?: typeof BILLING_CYCLES[number];

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  expiresAt?: string | null;

  @IsString()
  @IsOptional()
  status?: string;
}
