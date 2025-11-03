import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAddressDto {
	@IsNumber()
	@IsOptional()
	userId?: number;

	@IsString()
	@IsOptional()
	addressType?: string;

	@IsString()
	@IsOptional()
	label?: string;

	@IsString()
	@IsOptional()
	houseNumber?: string;

	@IsString()
	@IsOptional()
	unitNumber?: string;

	@IsString()
	@IsOptional()
	subdivision?: string;

	@IsString()
	@IsOptional()
	street?: string;

	@IsString()
	@IsOptional()
	barangay?: string;

	@IsString()
	@IsOptional()
	cityMunicipality?: string;

	@IsString()
	@IsOptional()
	province?: string;

	@IsString()
	@IsOptional()
	region?: string;

	@IsString()
	@IsOptional()
	zipCode?: string;

	@IsString()
	@IsOptional()
	country?: string;

	@IsString()
	@IsOptional()
	landmark?: string;

	@IsBoolean()
	@IsOptional()
	isPrimary?: boolean;

	@IsBoolean()
	@IsOptional()
	isVerified?: boolean;

	@IsString()
	@IsOptional()
	contactPhone?: string;

	@IsString()
	@IsOptional()
	contactName?: string;

	@IsString()
	@IsOptional()
	notes?: string;
}
