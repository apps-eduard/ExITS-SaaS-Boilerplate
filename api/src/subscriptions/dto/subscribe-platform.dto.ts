import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

const BILLING_CYCLES = ['monthly', 'quarterly', 'yearly', 'one_time'] as const;

export class SubscribePlatformDto {
  @IsString()
  platformType!: string;

  @IsNumber()
  @IsPositive()
  subscriptionPlanId!: number;

  @IsEnum(BILLING_CYCLES)
  @IsOptional()
  billingCycle?: typeof BILLING_CYCLES[number];

  @IsString()
  @IsOptional()
  startsAt?: string;
}
