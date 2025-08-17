import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsDateString, IsString, IsUUID, IsObject } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // Override tenantId to be optional for updates
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  // Override firstName and lastName to be optional for updates
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  businessData?: any;

  @IsOptional()
  @IsDateString()
  deletedAt?: string;

  @IsOptional()
  @IsString()
  deletedBy?: string;
}
