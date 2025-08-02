import { IsEnum, IsOptional, IsString, IsEmail, IsUrl, IsInt, Min, IsNotEmpty } from 'class-validator';
import { BusinessCategory } from '@prisma/client';

export class CreateTenantDto {
  @IsString()
  name: string;

  @IsEnum(BusinessCategory)
  category: BusinessCategory;

  // Owner details - required for creating the owner user
  @IsEmail()
  @IsNotEmpty()
  ownerEmail: string;

  @IsString()
  @IsNotEmpty()
  ownerFirstName: string;

  @IsString()
  @IsNotEmpty()
  ownerLastName: string;

  @IsOptional()
  @IsString()
  ownerPhoneNumber?: string;

  // Super admin can grant extra free branches for proof of concept
  @IsOptional()
  @IsInt()
  @Min(0)
  freeBranchOverride?: number;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;
}
