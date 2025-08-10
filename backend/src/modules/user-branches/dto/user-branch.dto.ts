import { IsString, IsBoolean, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { AccessLevel } from '@prisma/client';

export class CreateUserBranchDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  branchId: string;

  @IsEnum(['FULL_ACCESS', 'MANAGER_ACCESS', 'STAFF_ACCESS', 'READ_ONLY'])
  @IsOptional()
  accessLevel?: AccessLevel = 'STAFF_ACCESS';

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean = false;

  @IsOptional()
  permissions?: any; // JSON field for additional permissions
}

export class UpdateUserBranchDto {
  @IsEnum(['FULL_ACCESS', 'MANAGER_ACCESS', 'STAFF_ACCESS', 'READ_ONLY'])
  @IsOptional()
  accessLevel?: AccessLevel;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsOptional()
  permissions?: any; // JSON field for additional permissions
}

export class BulkAssignUserBranchDto {
  @IsUUID()
  userId: string;

  @IsUUID(4, { each: true })
  branchIds: string[];

  @IsEnum(['MANAGER_ACCESS', 'STAFF_ACCESS'])
  @IsOptional()
  accessLevel?: 'MANAGER_ACCESS' | 'STAFF_ACCESS' = 'STAFF_ACCESS';

  @IsUUID()
  @IsOptional()
  primaryBranchId?: string;
}
