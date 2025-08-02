import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { NotificationsService, NotificationResult } from './notifications.service';
import { SendNotificationDto, BulkNotificationDto } from './dto/notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Send a single notification
   * POST /notifications/send
   */
  @Post('send')
  async sendNotification(@Body() notificationDto: SendNotificationDto): Promise<NotificationResult> {
    return this.notificationsService.sendEnhancedNotification(notificationDto);
  }

  /**
   * Send bulk notifications
   * POST /notifications/bulk
   */
  @Post('bulk')
  async sendBulkNotifications(@Body() bulkDto: BulkNotificationDto): Promise<{ sent: number; failed: number; results: NotificationResult[] }> {
    return this.notificationsService.sendBulkExpiryNotifications(bulkDto.notifications);
  }

  /**
   * Send welcome notification
   * POST /notifications/welcome
   */
  @Post('welcome')
  async sendWelcomeNotification(
    @Body() body: { userId: string; email: string; name: string; tenantId?: string; businessType?: string }
  ): Promise<NotificationResult> {
    return this.notificationsService.sendWelcomeNotification(
      body.userId,
      body.email,
      body.name
    );
  }

  /**
   * Health check for notifications service
   * GET /notifications/health
   */
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'notifications',
      providers: ['email', 'sms', 'push'],
      businessTypes: ['GYM', 'COFFEE_SHOP', 'E_COMMERCE'],
      notificationTypes: ['expired', 'expiring_soon', 'welcome', 'general', 'reminder', 'promotion', 'update'],
      timestamp: new Date().toISOString()
    };
  }
}
