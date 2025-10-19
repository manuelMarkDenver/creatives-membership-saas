// src/users/dto/create-user.dto.ts
import {
  IsUUID,
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsEnum,
  IsObject,
} from 'class-validator';

// Import the Role enum from Prisma
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role; // Platform-level roles

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsObject()
  businessData?: any; // JSON field for business-specific data
}
