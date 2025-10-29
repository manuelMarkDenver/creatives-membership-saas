import {
  IsEnum,
  IsOptional,
  IsString,
  IsEmail,
  IsUrl,
  IsInt,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
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
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsEmail({}, { message: 'Business email must be a valid email address' })
  email?: string;

  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsUrl({}, { message: 'Website URL must be a valid URL' })
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
