import { IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { SubscriptionStatus } from '@prisma/client';

export class CreateSubscriptionDto {
  @IsString()
  branchId: string;

  @IsString()
  planId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}
