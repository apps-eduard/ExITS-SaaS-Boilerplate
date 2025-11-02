import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEmail } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  subdomain: string;

  @IsString()
  @IsOptional()
  plan?: string;

  @IsNumber()
  @IsOptional()
  maxUsers?: number;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @IsEmail()
  @IsOptional()
  adminEmail?: string;

  @IsString()
  @IsOptional()
  adminPassword?: string;

  @IsBoolean()
  @IsOptional()
  moneyLoanEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  bnplEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  pawnshopEnabled?: boolean;
}

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  maxUsers?: number;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @IsBoolean()
  @IsOptional()
  moneyLoanEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  bnplEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  pawnshopEnabled?: boolean;
}
