import { IsString, IsOptional, IsEnum } from 'class-validator';

export class RenewMembershipDto {
  @IsString()
  membershipPlanId: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string = 'cash';
}

export class CancelMembershipDto {
  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @IsOptional()
  @IsString()
  cancellationNotes?: string;
}

export class CreateTransactionDto {
  @IsString()
  customerId: string;

  @IsString()
  amount: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string = 'cash';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
