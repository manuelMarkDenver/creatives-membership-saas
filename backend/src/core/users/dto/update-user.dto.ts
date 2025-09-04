import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsDateString, IsString, IsUUID, IsObject, IsNumber, IsEnum } from 'class-validator';
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

  // Gym Member Profile fields
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  medicalConditions?: string;

  @IsOptional()
  @IsString()
  fitnessGoals?: string;

  @IsOptional()
  @IsString()
  preferredTrainer?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsObject()
  allergies?: any;

  @IsOptional()
  @IsDateString()
  lastVisit?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsNumber()
  totalVisits?: number;

  @IsOptional()
  @IsString()
  fitnessLevel?: string;

  @IsOptional()
  @IsObject()
  notifications?: any;

  @IsOptional()
  @IsString()
  favoriteEquipment?: string;

  @IsOptional()
  @IsNumber()
  averageVisitsPerWeek?: number;

  @IsOptional()
  @IsString()
  preferredWorkoutTime?: string;

  @IsOptional()
  @IsObject()
  membershipHistory?: any;

  @IsOptional()
  @IsObject()
  profileMetadata?: any;
}
