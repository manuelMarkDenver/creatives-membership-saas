// import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean, IsObject } from 'class-validator';
import { BusinessCategory, AccessLevel } from '@prisma/client';

export class CreateBranchDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsEnum(BusinessCategory)
  businessCategory: BusinessCategory;

  @IsOptional()
  @IsObject()
  branchData?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBranchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsEnum(BusinessCategory)
  businessCategory?: BusinessCategory;

  @IsOptional()
  @IsObject()
  branchData?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignUserToBranchDto {
  @IsUUID()
  userId: string;

  @IsEnum(AccessLevel)
  accessLevel: AccessLevel;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsObject()
  permissions?: Record<string, boolean>;
}

export class UpdateUserBranchAccessDto {
  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsObject()
  permissions?: Record<string, boolean>;
}
