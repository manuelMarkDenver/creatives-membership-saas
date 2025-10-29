import {
  IsEnum,
  IsOptional,
  IsString,
  IsEmail,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { BusinessCategory } from '@prisma/client';

export class RegisterTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(BusinessCategory)
  category: BusinessCategory;

  @IsString()
  @IsNotEmpty()
  ownerFirstName: string;

  @IsString()
  @IsNotEmpty()
  ownerLastName: string;

  @IsEmail()
  @IsNotEmpty()
  ownerEmail: string;

  @IsOptional()
  @IsString()
  ownerPhoneNumber?: string; // Optional for MVP, collected for future SMS

  @IsBoolean()
  @IsOptional()
  agreeToTerms?: boolean;
}
