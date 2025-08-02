import { IsEnum, IsOptional } from 'class-validator';
import { BusinessCategory } from '@prisma/client';

export class TenantQueryDto {
  @IsOptional()
  @IsEnum(BusinessCategory, {
    message: 'Category must be a valid BusinessCategory enum value',
  })
  category?: BusinessCategory;
}
