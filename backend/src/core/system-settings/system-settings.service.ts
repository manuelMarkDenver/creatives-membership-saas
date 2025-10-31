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
    const settings = await this.prisma.systemSettings.upsert({
      where: { id: 'system' },
      update: {
        passwordSecurityLevel: level,
        updatedBy,
      },
      create: {
        id: 'system',
        passwordSecurityLevel: level,
        updatedBy,
      },
    });

    this.logger.log(
      `Password security level updated to ${level} by user ${updatedBy}`,
    );

    return settings;
  }

  /**
   * Get current password security level (for password validation)
   */
  async getPasswordSecurityLevel(): Promise<PasswordSecurityLevel> {
    const settings = await this.getSettings();
    return settings.passwordSecurityLevel;
  }
}
