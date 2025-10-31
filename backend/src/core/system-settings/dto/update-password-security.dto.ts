import { IsEnum } from 'class-validator';
import { PasswordSecurityLevel } from '@prisma/client';

export class UpdatePasswordSecurityDto {
  @IsEnum(PasswordSecurityLevel, {
    message: 'passwordSecurityLevel must be one of: LOW, MEDIUM, HIGH',
  })
  passwordSecurityLevel: PasswordSecurityLevel;
}
