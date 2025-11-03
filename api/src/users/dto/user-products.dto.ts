import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class UserProductAssignmentDto {
  @IsString()
  productType: string;

  @IsString()
  @IsOptional()
  accessLevel?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsBoolean()
  @IsOptional()
  canApproveLoans?: boolean;

  @IsBoolean()
  @IsOptional()
  canDisburseFunds?: boolean;

  @IsBoolean()
  @IsOptional()
  canViewReports?: boolean;

  @IsBoolean()
  @IsOptional()
  canModifyInterest?: boolean;

  @IsBoolean()
  @IsOptional()
  canWaivePenalties?: boolean;

  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsOptional()
  maxApprovalAmount?: number;

  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsOptional()
  dailyTransactionLimit?: number;

  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsOptional()
  monthlyTransactionLimit?: number;

  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsOptional()
  maxDailyTransactions?: number;

  @IsString()
  @IsOptional()
  notes?: string | null;
}

export class UpdateUserProductsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserProductAssignmentDto)
  products: UserProductAssignmentDto[];
}
