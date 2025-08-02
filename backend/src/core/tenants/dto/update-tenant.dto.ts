import { PartialType } from '@nestjs/mapped-types';
import { CreateTenantDto } from './create-tenant.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @IsOptional()
  @IsString()
  slug?: string; // we allow it in type but don't expect it from client
}
