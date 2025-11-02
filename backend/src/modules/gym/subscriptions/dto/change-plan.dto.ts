import { IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ChangePlanDto {
  @IsString()
  gymMembershipPlanId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  paymentAmount: number;

  @IsString()
  paymentMethod: string;
}
