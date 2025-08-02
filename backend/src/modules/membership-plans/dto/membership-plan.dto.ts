import { IsString, IsOptional, IsDecimal, IsInt, IsEnum, IsBoolean, IsUUID, Min } from 'class-validator';
import { MembershipType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateMembershipPlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDecimal()
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

  @IsUUID()
  tenantId: string;
}

export class UpdateMembershipPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDecimal()
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
}
