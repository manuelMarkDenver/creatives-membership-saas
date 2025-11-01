import { PartialType } from '@nestjs/mapped-types';
import { CreateTenantDto } from './create-tenant.dto';
import { IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @IsOptional()
  @IsString()
  slug?: string; // we allow it in type but don't expect it from client

  // Email notification preferences
  @IsOptional()
  @IsBoolean()
  emailNotificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  welcomeEmailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  adminAlertEmailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  tenantNotificationEmailEnabled?: boolean;

  @IsOptional()
  @IsString()
  digestFrequency?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  adminEmailRecipients?: string[];
}
