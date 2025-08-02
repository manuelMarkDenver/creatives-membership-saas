import { Injectable, Logger } from '@nestjs/common';

export interface NotificationData {
  userId: string;
  recipientName: string;
  email: string;
  phoneNumber?: string;
  tenantId: string;
  businessType?: 'GYM' | 'COFFEE_SHOP' | 'E_COMMERCE';
  notificationType:
    | 'expired'
    | 'expiring_soon'
    | 'welcome'
    | 'general'
    | 'reminder'
    | 'promotion'
    | 'update';
  // Generic data for any business type
  templateData?: Record<string, any>;
  // Optional tenant branding
  tenantBranding?: {
    name: string;
    logo?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
}

export interface NotificationResult {
  success: boolean;
  message: string;
  provider?: 'email' | 'sms' | 'push';
  externalId?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /**
   * Legacy method for backward compatibility
   */
  sendMembershipExpiryNotification(memberId: string) {
    this.logger.log(`Stub: Sending expiry notification for member ${memberId}`);
    return { success: true };
  }

  /**
   * Enhanced notification method with rich data
   * TODO: Integrate with actual notification providers (AWS SNS, Twilio, etc.)
   */
  async sendEnhancedNotification(
    notificationData: NotificationData,
  ): Promise<NotificationResult> {
    this.logger.log(
      `Sending ${notificationData.notificationType} notification to ${notificationData.recipientName} (${notificationData.email})`,
    );

    try {
      // TODO: Replace with actual notification service integration
      // Example providers:
      // - Email: AWS SES, SendGrid, Mailgun
      // - SMS: AWS SNS, Twilio, Plivo
      // - Push: Firebase Cloud Messaging, AWS SNS Mobile Push

      // Simulate email notification
      const emailResult =
        await this.simulateEmailNotification(notificationData);

      // Simulate SMS notification if phone number exists
      if (notificationData.phoneNumber) {
        await this.simulateSMSNotification(notificationData);
      }

      this.logger.log(
        `Notification sent successfully to ${notificationData.recipientName}`,
      );

      return {
        success: true,
        message: 'Notification sent successfully',
        provider: 'email',
      };
    } catch (error) {
      this.logger.error(
        `Failed to send notification: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: `Failed to send notification: ${error.message}`,
      };
    }
  }

  /**
   * Send welcome notification to new user
   */
  async sendWelcomeNotification(
    userId: string,
    email: string,
    name: string,
  ): Promise<NotificationResult> {
    this.logger.log(`Sending welcome notification to ${name} (${email})`);

    const notificationData: NotificationData = {
      userId,
      recipientName: name,
      email,
      tenantId: '', // TODO: Pass tenant ID from caller
      notificationType: 'welcome',
    };

    return this.sendEnhancedNotification(notificationData);
  }

  /**
   * Send bulk notifications for expiring memberships
   */
  async sendBulkExpiryNotifications(
    notifications: NotificationData[],
  ): Promise<{ sent: number; failed: number; results: NotificationResult[] }> {
    this.logger.log(
      `Sending bulk expiry notifications to ${notifications.length} users`,
    );

    const results: NotificationResult[] = [];
    let sent = 0;
    let failed = 0;

    for (const notification of notifications) {
      try {
        const result = await this.sendEnhancedNotification(notification);
        results.push(result);

        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        results.push({
          success: false,
          message: `Failed to send notification: ${error.message}`,
        });
      }
    }

    this.logger.log(
      `Bulk notification complete: ${sent} sent, ${failed} failed`,
    );

    return { sent, failed, results };
  }

  // Private helper methods for simulation (replace with actual integrations)

  private async simulateEmailNotification(
    data: NotificationData,
  ): Promise<NotificationResult> {
    const subject = this.getEmailSubject(data);
    const body = this.getEmailBody(data);

    this.logger.debug(`📧 Email notification:
 Subject: ${subject}
 To: ${data.email}
 Body: ${body.substring(0, 100)}...`);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      success: true,
      message: 'Email notification simulated',
      provider: 'email',
      externalId: `email_${Date.now()}`,
    };
  }

  private async simulateSMSNotification(
    data: NotificationData,
  ): Promise<NotificationResult> {
    const message = this.getSMSMessage(data);

    this.logger.debug(`📱 SMS notification:
 To: ${data.phoneNumber}
 Message: ${message}`);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 150));

    return {
      success: true,
      message: 'SMS notification simulated',
      provider: 'sms',
      externalId: `sms_${Date.now()}`,
    };
  }

  private getEmailSubject(data: NotificationData): string {
    const businessName = data.tenantBranding?.name || 'Our Service';

    switch (data.notificationType) {
      case 'expired':
        return this.getBusinessSpecificSubject(data, 'expired');
      case 'expiring_soon':
        return this.getBusinessSpecificSubject(data, 'expiring_soon');
      case 'welcome':
        return `🎉 Welcome to ${businessName}!`;
      case 'reminder':
        return `⏰ Reminder from ${businessName}`;
      case 'promotion':
        return `🎯 Special Offer from ${businessName}`;
      case 'update':
        return `📢 Update from ${businessName}`;
      default:
        return `📬 Notification from ${businessName}`;
    }
  }

  private getBusinessSpecificSubject(
    data: NotificationData,
    type: string,
  ): string {
    const businessName = data.tenantBranding?.name || 'Our Service';

    switch (data.businessType) {
      case 'GYM':
        return type === 'expired'
          ? `🏋️ Your Membership Has Expired - ${businessName}`
          : `⏰ Your Membership Is Expiring Soon - ${businessName}`;
      case 'COFFEE_SHOP':
        return type === 'expired'
          ? `☕ Your Loyalty Card Has Expired - ${businessName}`
          : `⏰ Your Loyalty Benefits Are Expiring - ${businessName}`;
      case 'E_COMMERCE':
        return type === 'expired'
          ? `🛒 Your Account Benefits Have Expired - ${businessName}`
          : `⏰ Your Premium Features Are Expiring - ${businessName}`;
      default:
        return type === 'expired'
          ? `Your Service Has Expired - ${businessName}`
          : `Your Service Is Expiring Soon - ${businessName}`;
    }
  }

  private getEmailBody(data: NotificationData): string {
    const businessName = data.tenantBranding?.name || 'Our Service';
    const recipientName = data.recipientName;

    switch (data.notificationType) {
      case 'expired':
        return this.getExpiredEmailBody(data, businessName, recipientName);
      case 'expiring_soon':
        return this.getExpiringSoonEmailBody(data, businessName, recipientName);
      case 'welcome':
        return this.getWelcomeEmailBody(data, businessName, recipientName);
      case 'reminder':
        return this.getReminderEmailBody(data, businessName, recipientName);
      case 'promotion':
        return this.getPromotionEmailBody(data, businessName, recipientName);
      case 'update':
        return this.getUpdateEmailBody(data, businessName, recipientName);
      default:
        return `Hi ${recipientName},\n\nYou have a notification from ${businessName}.\n\n${data.templateData?.message || 'Please check your account for more details.'}\n\nBest regards,\nThe ${businessName} Team`;
    }
  }

  private getExpiredEmailBody(
    data: NotificationData,
    businessName: string,
    recipientName: string,
  ): string {
    const template = data.templateData;

    switch (data.businessType) {
      case 'GYM':
        return `Hi ${recipientName},\n\nYour ${template?.membershipType || 'membership'} has expired${template?.expirationDate ? ` on ${template.expirationDate}` : ''}. Please contact us to renew your membership and continue enjoying our facilities.\n\nBest regards,\nThe ${businessName} Team`;
      case 'COFFEE_SHOP':
        return `Hi ${recipientName},\n\nYour loyalty benefits have expired${template?.expirationDate ? ` on ${template.expirationDate}` : ''}. Visit us to renew and continue earning rewards on your favorite drinks!\n\nBest regards,\nThe ${businessName} Team`;
      case 'E_COMMERCE':
        return `Hi ${recipientName},\n\nYour premium account benefits have expired${template?.expirationDate ? ` on ${template.expirationDate}` : ''}. Renew now to continue enjoying exclusive discounts and features.\n\nBest regards,\nThe ${businessName} Team`;
      default:
        return `Hi ${recipientName},\n\nYour service has expired${template?.expirationDate ? ` on ${template.expirationDate}` : ''}. Please contact us to renew and continue using our services.\n\nBest regards,\nThe ${businessName} Team`;
    }
  }

  private getExpiringSoonEmailBody(
    data: NotificationData,
    businessName: string,
    recipientName: string,
  ): string {
    const template = data.templateData;
    const daysUntilExpiry = template?.daysUntilExpiry || 'soon';

    switch (data.businessType) {
      case 'GYM':
        return `Hi ${recipientName},\n\nYour ${template?.membershipType || 'membership'} will expire in ${daysUntilExpiry} days${template?.expirationDate ? ` on ${template.expirationDate}` : ''}. Please renew to avoid any interruption to your fitness journey.\n\nBest regards,\nThe ${businessName} Team`;
      case 'COFFEE_SHOP':
        return `Hi ${recipientName},\n\nYour loyalty benefits will expire in ${daysUntilExpiry} days${template?.expirationDate ? ` on ${template.expirationDate}` : ''}. Don't miss out on your rewards - visit us soon!\n\nBest regards,\nThe ${businessName} Team`;
      case 'E_COMMERCE':
        return `Hi ${recipientName},\n\nYour premium features will expire in ${daysUntilExpiry} days${template?.expirationDate ? ` on ${template.expirationDate}` : ''}. Renew now to keep your exclusive benefits.\n\nBest regards,\nThe ${businessName} Team`;
      default:
        return `Hi ${recipientName},\n\nYour service will expire in ${daysUntilExpiry} days${template?.expirationDate ? ` on ${template.expirationDate}` : ''}. Please renew to continue using our services.\n\nBest regards,\nThe ${businessName} Team`;
    }
  }

  private getWelcomeEmailBody(
    data: NotificationData,
    businessName: string,
    recipientName: string,
  ): string {
    switch (data.businessType) {
      case 'GYM':
        return `Hi ${recipientName},\n\nWelcome to ${businessName}! We're excited to have you as a member and look forward to supporting your fitness goals.\n\nEnjoy your workouts!\nThe ${businessName} Team`;
      case 'COFFEE_SHOP':
        return `Hi ${recipientName},\n\nWelcome to ${businessName}! We're thrilled to have you join our community of coffee lovers. Your loyalty journey starts now!\n\nEnjoy your first cup on us!\nThe ${businessName} Team`;
      case 'E_COMMERCE':
        return `Hi ${recipientName},\n\nWelcome to ${businessName}! Thank you for joining us. We're excited to help you discover amazing products and exclusive deals.\n\nHappy shopping!\nThe ${businessName} Team`;
      default:
        return `Hi ${recipientName},\n\nWelcome to ${businessName}! We're excited to have you with us and look forward to serving you.\n\nBest regards,\nThe ${businessName} Team`;
    }
  }

  private getReminderEmailBody(
    data: NotificationData,
    businessName: string,
    recipientName: string,
  ): string {
    const message =
      data.templateData?.message ||
      'You have a pending action in your account.';
    return `Hi ${recipientName},\n\nThis is a friendly reminder from ${businessName}.\n\n${message}\n\nBest regards,\nThe ${businessName} Team`;
  }

  private getPromotionEmailBody(
    data: NotificationData,
    businessName: string,
    recipientName: string,
  ): string {
    const offerDetails =
      data.templateData?.offerDetails || 'Check out our latest offers!';
    return `Hi ${recipientName},\n\nWe have an exciting promotion for you at ${businessName}!\n\n${offerDetails}\n\nDon't miss out on this limited-time offer!\nThe ${businessName} Team`;
  }

  private getUpdateEmailBody(
    data: NotificationData,
    businessName: string,
    recipientName: string,
  ): string {
    const updateDetails =
      data.templateData?.updateDetails ||
      'We have some updates to share with you.';
    return `Hi ${recipientName},\n\nWe wanted to keep you informed about recent updates at ${businessName}.\n\n${updateDetails}\n\nThank you for staying with us!\nThe ${businessName} Team`;
  }

  private getSMSMessage(data: NotificationData): string {
    const businessName = data.tenantBranding?.name || 'Our Service';
    const recipientName = data.recipientName;
    const template = data.templateData;

    switch (data.notificationType) {
      case 'expired':
        return this.getExpiredSMSMessage(
          data,
          businessName,
          recipientName,
          template,
        );
      case 'expiring_soon':
        return this.getExpiringSoonSMSMessage(
          data,
          businessName,
          recipientName,
          template,
        );
      case 'welcome':
        return `Welcome to ${businessName}, ${recipientName}! We're excited to have you with us.`;
      case 'reminder':
        return `Hi ${recipientName}, reminder from ${businessName}: ${template?.message || 'Please check your account.'}`;
      case 'promotion':
        return `Hi ${recipientName}, special offer from ${businessName}! ${template?.offerDetails || 'Check out our latest deals.'}`;
      case 'update':
        return `Hi ${recipientName}, update from ${businessName}: ${template?.updateDetails || 'We have news to share.'}`;
      default:
        return `Hi ${recipientName}, you have a notification from ${businessName}.`;
    }
  }

  private getExpiredSMSMessage(
    data: NotificationData,
    businessName: string,
    recipientName: string,
    template: any,
  ): string {
    const service = this.getServiceName(data.businessType);
    const expDate = template?.expirationDate
      ? ` on ${template.expirationDate}`
      : '';
    return `Hi ${recipientName}, your ${service} expired${expDate}. Please renew to continue access. - ${businessName}`;
  }

  private getExpiringSoonSMSMessage(
    data: NotificationData,
    businessName: string,
    recipientName: string,
    template: any,
  ): string {
    const service = this.getServiceName(data.businessType);
    const days = template?.daysUntilExpiry || 'soon';
    return `Hi ${recipientName}, your ${service} expires in ${days} days. Renew now to avoid interruption. - ${businessName}`;
  }

  private getServiceName(businessType?: string): string {
    switch (businessType) {
      case 'GYM':
        return 'membership';
      case 'COFFEE_SHOP':
        return 'loyalty benefits';
      case 'E_COMMERCE':
        return 'premium features';
      default:
        return 'service';
    }
  }
}
