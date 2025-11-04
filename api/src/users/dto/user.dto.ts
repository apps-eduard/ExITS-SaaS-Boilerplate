import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsNumber } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsNumber()
  @IsOptional()
  tenantId?: number;

  @IsNumber()
  @IsOptional()
  roleId?: number;

  @IsString()
  @IsOptional()
  status?: string;

  // Employee profile fields
  @IsString()
  @IsOptional()
  position?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  employmentType?: string;

  @IsString()
  @IsOptional()
  employmentStatus?: string;

  @IsString()
  @IsOptional()
  hireDate?: string;

  @IsString()
  @IsOptional()
  workPhone?: string;

  @IsString()
  @IsOptional()
  workEmail?: string;

  @IsString()
  @IsOptional()
  phoneExtension?: string;

  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  roleId?: number;

  // Employee profile fields
  @IsString()
  @IsOptional()
  position?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  employmentType?: string;

  @IsString()
  @IsOptional()
  employmentStatus?: string;

  @IsString()
  @IsOptional()
  hireDate?: string;

  @IsString()
  @IsOptional()
  workPhone?: string;

  @IsString()
  @IsOptional()
  workEmail?: string;

  @IsString()
  @IsOptional()
  phoneExtension?: string;

  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
