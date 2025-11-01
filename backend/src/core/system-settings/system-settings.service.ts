import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordSecurityLevel } from '@prisma/client';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get system settings (creates default if not exists)
   */
  async getSettings() {
    let settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'system' },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          id: 'system',
          passwordSecurityLevel: 'MEDIUM',
        },
      });
      this.logger.log('Created default system settings');
    }

    return settings;
  }

  /**
   * Update password security level (SUPER_ADMIN only)
   */
  async updatePasswordSecurityLevel(
    level: PasswordSecurityLevel,
    updatedBy: string,
  ) {
    // Get current settings to log the change
    const currentSettings = await this.getSettings();
    const previousLevel = currentSettings.passwordSecurityLevel;

    const settings = await this.prisma.systemSettings.upsert({
      where: { id: 'system' },
      update: {
        passwordSecurityLevel: level,
        updatedBy,
        updatedAt: new Date(),
      },
      create: {
        id: 'system',
        passwordSecurityLevel: level,
        updatedBy,
      },
    });

    // Enhanced audit logging
    this.logger.log(
      `🔐 SYSTEM SETTINGS AUDIT: Password security level changed from ${previousLevel} to ${level} by user ${updatedBy}`,
    );

    // Log security impact
    const impact = this.getSecurityLevelImpact(previousLevel, level);
    this.logger.log(`🔐 SECURITY IMPACT: ${impact}`);

    return settings;
  }

  private getSecurityLevelImpact(
    previous: PasswordSecurityLevel,
    current: PasswordSecurityLevel,
  ): string {
    const levels = { LOW: 1, MEDIUM: 2, HIGH: 3 };
    const prevLevel = levels[previous];
    const currLevel = levels[current];

    if (currLevel > prevLevel) {
      return `Security strengthened - new accounts will require stronger passwords`;
    } else if (currLevel < prevLevel) {
      return `Security relaxed - new accounts will have weaker password requirements`;
    } else {
      return `No security level change`;
    }
  }

  /**
   * Get current password security level (for password validation)
   */
  async getPasswordSecurityLevel(): Promise<PasswordSecurityLevel> {
    const settings = await this.getSettings();
    return settings.passwordSecurityLevel;
  }

  /**
   * Update global admin notification settings
   */
  async updateGlobalAdminSettings(
    data: {
      globalAdminEmails?: string[];
      newTenantAlertsEnabled?: boolean;
      systemAlertsEnabled?: boolean;
      securityAlertsEnabled?: boolean;
      tenantNotificationsEnabled?: boolean;
    },
    updatedBy: string,
  ) {
    const settings = await this.prisma.systemSettings.upsert({
      where: { id: 'system' },
      update: {
        ...data,
        updatedBy,
        updatedAt: new Date(),
      },
      create: {
        id: 'system',
        passwordSecurityLevel: 'MEDIUM',
        globalAdminEmails: data.globalAdminEmails || [],
        newTenantAlertsEnabled: data.newTenantAlertsEnabled ?? true,
        systemAlertsEnabled: data.systemAlertsEnabled ?? true,
        securityAlertsEnabled: data.securityAlertsEnabled ?? true,
        tenantNotificationsEnabled: data.tenantNotificationsEnabled ?? true,
        updatedBy,
      },
    });

    this.logger.log(
      `📧 SYSTEM SETTINGS AUDIT: Global admin settings updated by user ${updatedBy}`,
    );

    return settings;
  }

  /**
   * Get global admin emails for notifications
   */
  async getGlobalAdminEmails(): Promise<string[]> {
    const settings = await this.getSettings();
    return settings.globalAdminEmails || [];
  }

  /**
   * Check if new tenant alerts are enabled
   */
  async areNewTenantAlertsEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.newTenantAlertsEnabled ?? true;
  }
}
