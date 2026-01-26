import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DailyEntryStatus } from '@prisma/client';

export class GetDailyEntriesDto {
  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsEnum(DailyEntryStatus)
  @IsOptional()
  status?: DailyEntryStatus;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}

export class VoidEntryDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UnvoidEntryDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

export class DailyEntryResponseDto {
  id: string;
  gymId: string;
  terminalId?: string | null;
  cardUid: string;
  occurredAt: Date;
  amount: number;
  status: DailyEntryStatus;
  voidedAt?: Date | null;
  voidedByUserId?: string | null;
  voidReason?: string | null;
  createdAt: Date;
  gym?: {
    id: string;
    name: string;
  };
  terminal?: {
    id: string;
    name: string;
  } | null;
}

export class DailySummaryResponseDto {
  recordedCount: number;
  recordedAmountTotal: number;
  voidedCount: number;
  voidedAmountTotal: number;
}

export class DailyEntriesResponseDto {
  entries: DailyEntryResponseDto[];
  summary: DailySummaryResponseDto;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
