import { IsString, IsNumber, IsBoolean, IsEnum, IsOptional, Min, MaxLength } from 'class-validator';
import { BillingCycle } from '@prisma/client';

export class CreatePlanDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
