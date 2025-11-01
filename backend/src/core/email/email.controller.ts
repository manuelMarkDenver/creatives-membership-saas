import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import { RBACGuard } from '../guard/rbac.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('email')
@UseGuards(RBACGuard)
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  // Template Management
  @Get('templates')
  @Roles('OWNER', 'MANAGER', 'SUPER_ADMIN')
  async getTemplates(@Query('tenantId') tenantId?: string) {
    return this.prisma.emailTemplate.findMany({
      where: {
        OR: [
          { tenantId: tenantId },
          { tenantId: null }, // Global templates
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('templates')
  @Roles('OWNER', 'SUPER_ADMIN')
  async createTemplate(
    @Body() data: {
      tenantId?: string;
      templateType: string;
      name: string;
      subject: string;
      htmlContent: string;
      textContent?: string;
      variables?: any;
    },
  ) {
    return this.prisma.emailTemplate.create({
      data: {
        ...data,
        isActive: true,
      },
    });
  }

  @Put('templates/:id')
  @Roles('OWNER', 'SUPER_ADMIN')
  async updateTemplate(
    @Param('id') id: string,
    @Body() data: Partial<{
      name: string;
      subject: string;
      htmlContent: string;
      textContent: string;
      variables: any;
      isActive: boolean;
    }>,
  ) {
    return this.prisma.emailTemplate.update({
      where: { id },
      data,
    });
  }

  @Delete('templates/:id')
  @Roles('OWNER', 'SUPER_ADMIN')
  async deleteTemplate(@Param('id') id: string) {
    return this.prisma.emailTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Email Logs
  @Get('logs')
  @Roles('OWNER', 'SUPER_ADMIN')
  async getEmailLogs(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('limit') limit = 50,
  ) {
    return this.prisma.emailLog.findMany({
      where: {
        tenantId,
        ...(status && { status }),
      },
      include: {
        template: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit.toString()),
    });
  }

  // Send Emails
  @Post('send-welcome')
  @Roles('OWNER', 'MANAGER')
  async sendWelcomeEmail(
    @Body() data: {
      email: string;
      name: string;
      tenantId: string;
      membershipPlanName?: string;
    },
  ) {
    await this.emailService.sendWelcomeEmail(
      data.email,
      data.name,
      data.tenantId,
      data.membershipPlanName,
    );
    return { success: true, message: 'Welcome email sent successfully' };
  }

  @Post('send-admin-alert')
  @Roles('SUPER_ADMIN') // Only super admin can send admin alerts
  async sendAdminAlert(
    @Body() data: {
      tenantName: string;
      ownerEmail: string;
      tenantId: string;
    },
  ) {
    await this.emailService.sendAdminAlert(
      data.tenantName,
      data.ownerEmail,
      data.tenantId,
    );
    return { success: true, message: 'Admin alert sent successfully' };
  }

  @Post('send-tenant-notification')
  @Roles('SUPER_ADMIN') // Only super admin can send tenant notifications
  async sendTenantNotification(
    @Body() data: {
      tenantId: string;
      memberName: string;
      memberEmail: string;
      membershipPlanName?: string;
    },
  ) {
    await this.emailService.sendTenantNotification(
      data.tenantId,
      data.memberName,
      data.memberEmail,
      data.membershipPlanName,
    );
    return { success: true, message: 'Tenant notification sent successfully' };
  }
}