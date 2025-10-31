import { PasswordSecurityLevel } from '@prisma/client';

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  description: string;
}

export const PASSWORD_REQUIREMENTS: Record<
  PasswordSecurityLevel,
  PasswordRequirements
> = {
  LOW: {
    minLength: 6,
    requireUppercase: false,
    requireLowercase: true,
    requireNumber: false,
    requireSpecialChar: false,
    description: 'At least 6 characters',
  },
  MEDIUM: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: false,
    description:
      'At least 8 characters with uppercase, lowercase, and number',
  },
  HIGH: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true,
    description:
      'At least 8 characters with uppercase, lowercase, number, and special character',
  },
};

export function validatePassword(
  password: string,
  level: PasswordSecurityLevel,
): { valid: boolean; errors: string[] } {
  const requirements = PASSWORD_REQUIREMENTS[level];
  const errors: string[] = [];

  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }

  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requirements.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requirements.requireSpecialChar && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getPasswordRequirements(
  level: PasswordSecurityLevel,
): PasswordRequirements {
  return PASSWORD_REQUIREMENTS[level];
}
