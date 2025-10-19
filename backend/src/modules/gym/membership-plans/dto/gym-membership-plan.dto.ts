import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsEnum,
  IsBoolean,
  Min,
} from 'class-validator';
import { MembershipType, BranchAccessLevel } from '@prisma/client';
import { Type } from 'class-transformer';

// DTO for frontend requests (without tenantId or soft delete fields)
export class CreateGymMembershipPlanRequestDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  price: number;

  @IsInt()
  @Min(1)
  duration: number; // Duration in days

  @IsEnum(MembershipType)
  type: MembershipType;

  @IsOptional()
  benefits?: string[]; // Will be converted to JSON

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(BranchAccessLevel)
  accessLevel?: BranchAccessLevel; // Optional, defaults to ALL_BRANCHES
}

// DTO for internal use (with tenantId)
export class CreateGymMembershipPlanDto extends CreateGymMembershipPlanRequestDto {
  tenantId: string;
}

// DTO for update requests
export class UpdateGymMembershipPlanRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsEnum(MembershipType)
  type?: MembershipType;

  @IsOptional()
  benefits?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(BranchAccessLevel)
  accessLevel?: BranchAccessLevel;
}

// DTO for soft delete requests
export class SoftDeleteGymMembershipPlanDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// DTO for restore requests
export class RestoreGymMembershipPlanDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}