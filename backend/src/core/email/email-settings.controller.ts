import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '../auth/auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/email-settings')
@UseGuards(AuthGuard, RoleGuard)
@Roles('SUPER_ADMIN')
export class EmailSettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getEmailSettings() {
    let settings = await this.prisma.emailSettings.findFirst();
    if (!settings) {
      // Create default settings if none exist
      settings = await this.prisma.emailSettings.create({
        data: {
          smtpHost: 'localhost',
          smtpPort: 1025,
          fromEmail: 'noreply@gymbosslab.com',
          fromName: 'GymBossLab',
          mailpitEnabled: true,
        },
      });
    }
    return settings;
  }

  @Put()
  async updateEmailSettings(
    @Body() data: {
      smtpHost?: string;
      smtpPort?: number;
      smtpUser?: string;
      smtpPassword?: string;
      fromEmail?: string;
      fromName?: string;
      brevoApiKey?: string;
      mailpitEnabled?: boolean;
    },
  ) {
    const existing = await this.prisma.emailSettings.findFirst();
    if (existing) {
      return this.prisma.emailSettings.update({
        where: { id: existing.id },
        data: {
          smtpHost: data.smtpHost || existing.smtpHost,
          smtpPort: data.smtpPort || existing.smtpPort,
          smtpUser: data.smtpUser !== undefined ? data.smtpUser : existing.smtpUser,
          smtpPassword: data.smtpPassword !== undefined ? data.smtpPassword : existing.smtpPassword,
          fromEmail: data.fromEmail || existing.fromEmail,
          fromName: data.fromName || existing.fromName,
          brevoApiKey: data.brevoApiKey !== undefined ? data.brevoApiKey : existing.brevoApiKey,
          mailpitEnabled: data.mailpitEnabled !== undefined ? data.mailpitEnabled : existing.mailpitEnabled,
        },
      });
    } else {
      return this.prisma.emailSettings.create({
        data: {
          smtpHost: data.smtpHost || 'localhost',
          smtpPort: data.smtpPort || 1025,
          smtpUser: data.smtpUser || null,
          smtpPassword: data.smtpPassword || null,
          fromEmail: data.fromEmail || 'noreply@gymbosslab.com',
          fromName: data.fromName || 'GymBossLab',
          brevoApiKey: data.brevoApiKey || null,
          mailpitEnabled: data.mailpitEnabled !== undefined ? data.mailpitEnabled : true,
        },
      });
    }
  }
}