import type { PasswordSecurityLevel } from '../api/system-settings'

export interface PasswordRequirement {
  test: (password: string) => boolean
  label: string
  value: string
}

export interface PasswordRequirements {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumber: boolean
  requireSpecialChar: boolean
  description: string
}

export const PASSWORD_REQUIREMENTS_CONFIG: Record<
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
    description: 'At least 8 characters with uppercase, lowercase, and number',
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
}

export function getPasswordRequirements(
  level: PasswordSecurityLevel
): PasswordRequirement[] {
  const config = PASSWORD_REQUIREMENTS_CONFIG[level]
  const requirements: PasswordRequirement[] = []

  requirements.push({
    test: (password) => password.length >= config.minLength,
    label: `At least ${config.minLength} characters`,
    value: 'length',
  })

  if (config.requireUppercase) {
    requirements.push({
      test: (password) => /[A-Z]/.test(password),
      label: 'Contains uppercase letter',
      value: 'uppercase',
    })
  }

  if (config.requireLowercase) {
    requirements.push({
      test: (password) => /[a-z]/.test(password),
      label: 'Contains lowercase letter',
      value: 'lowercase',
    })
  }

  if (config.requireNumber) {
    requirements.push({
      test: (password) => /[0-9]/.test(password),
      label: 'Contains number',
      value: 'number',
    })
  }

  if (config.requireSpecialChar) {
    requirements.push({
      test: (password) => /[^A-Za-z0-9]/.test(password),
      label: 'Contains special character',
      value: 'special',
    })
  }

  return requirements
}

export function validatePassword(
  password: string,
  level: PasswordSecurityLevel
): { valid: boolean; errors: string[] } {
  const requirements = getPasswordRequirements(level)
  const errors: string[] = []

  requirements.forEach((req) => {
    if (!req.test(password)) {
      errors.push(req.label)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}
