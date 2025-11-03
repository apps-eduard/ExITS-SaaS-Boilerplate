import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const BILLING_CYCLES = ['monthly', 'quarterly', 'yearly', 'one_time'] as const;

export class UpdatePlanDto {
	@IsString()
	@MaxLength(255)
	@IsOptional()
	name?: string;

	@IsString()
	@IsOptional()
	description?: string | null;

	@IsNumber()
	@Min(0)
	@IsOptional()
	price?: number;

	@IsEnum(BILLING_CYCLES)
	@IsOptional()
	billingCycle?: typeof BILLING_CYCLES[number];

	@IsNumber()
	@IsOptional()
	trialDays?: number | null;

	@IsNumber()
	@IsOptional()
	maxUsers?: number | null;

	@IsNumber()
	@IsOptional()
	maxStorageGb?: number | null;

	@IsBoolean()
	@IsOptional()
	isFeatured?: boolean;

	@IsBoolean()
	@IsOptional()
	customPricing?: boolean;

	@IsArray()
	@IsOptional()
	features?: string[];

	@IsString()
	@IsOptional()
	status?: string;

	@IsString()
	@IsOptional()
	productType?: string | null;
}
