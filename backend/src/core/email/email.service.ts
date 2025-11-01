import sgMail from '@sendgrid/mail';
import * as nodemailer from 'nodemailer';
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

type EmailProvider = 'sendgrid' | 'resend' | 'mailgun' | 'brevo' | 'smtp';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private provider: EmailProvider = 'smtp';
  private settings: any = null;

  constructor(private readonly prisma: PrismaService) {
    // Initialize with environment-based defaults for now
    // Settings will be loaded lazily when needed
    this.initializeProviderSync();
  }

  private initializeProviderSync() {
    const isDev = process.env.NODE_ENV !== 'production';

    // DEVELOPMENT: Always use Mailpit (SMTP)
    if (isDev) {
      this.provider = 'smtp';
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '1025'),
        secure: false,
        ignoreTLS: true,
      });
      this.logger.log('🧪 [DEVELOPMENT MODE]');
      this.logger.log(
        `✅ Email service using Mailpit SMTP (${process.env.SMTP_HOST || 'localhost'}:${process.env.SMTP_PORT || '1025'})`,
      );
      this.logger.log('📧 View emails at: http://localhost:8025');
      return;
    }

    // PRODUCTION: Start with environment variables, will load from DB when needed
    this.configureProviderFromEnv();
  }

  private async ensureSettingsLoaded() {
    if (this.settings) return; // Already loaded

    try {
      const dbSettings = await this.prisma.emailSettings.findFirst();
      if (dbSettings) {
        this.settings = dbSettings;
        this.configureProviderFromSettings(dbSettings);
        this.logger.log('✅ Email service configured from database settings');
      }
    } catch (error) {
      this.logger.warn('⚠️  Could not load email settings from database, using environment fallback');
    }
  }

  private configureProviderFromSettings(settings: any) {
    // Priority: Environment variables first, then database settings
    // API keys should be in environment variables for security
    if (process.env.BREVO_API_KEY) {
      this.provider = 'brevo';
      this.logger.log('✅ Email service using Brevo (from environment)');
    } else if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.provider = 'sendgrid';
      this.logger.log('✅ Email service using SendGrid (from environment)');
    } else if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      this.provider = 'mailgun';
      this.logger.log('✅ Email service using Mailgun (from environment)');
    } else if (process.env.RESEND_API_KEY) {
      this.provider = 'resend';
      this.logger.log('✅ Email service using Resend (from environment)');
    } else {
      // Fallback to SMTP from database settings
      this.provider = 'smtp';
      this.transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: false,
        ignoreTLS: true,
        auth: settings.smtpUser ? {
          user: settings.smtpUser,
          pass: settings.smtpPassword,
        } : undefined,
      });
      this.logger.log(`✅ Email service using SMTP (${settings.smtpHost}:${settings.smtpPort})`);
    }
  }

  private configureProviderFromEnv() {
    // PRODUCTION: Check for email providers in priority order
    // Priority: Brevo > SendGrid > Mailgun > Resend > SMTP (fallback)
    if (process.env.BREVO_API_KEY) {
      this.provider = 'brevo';
      this.logger.log('✅ [PRODUCTION] Email service using Brevo');
    } else if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.provider = 'sendgrid';
      this.logger.log('✅ [PRODUCTION] Email service using SendGrid');
    } else if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      this.provider = 'mailgun';
      this.logger.log('✅ [PRODUCTION] Email service using Mailgun');
    } else if (process.env.RESEND_API_KEY) {
      this.provider = 'resend';
      this.logger.log('✅ [PRODUCTION] Email service using Resend');
    } else {
      // Fallback to SMTP in production (not recommended)
      this.logger.warn('⚠️  [PRODUCTION] No email provider configured, falling back to SMTP');
      this.logger.warn('⚠️  Configure BREVO_API_KEY for production email delivery');
      this.provider = 'smtp';
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '1025'),
        secure: false,
        ignoreTLS: true,
      });
    }
  }

  /**
   * Intercepts email in development mode if DEV_EMAIL_INTERCEPT is set
   * Logs original recipient and redirects to dev email
   */
  private getRecipient(originalEmail: string): string {
    const isDev = process.env.NODE_ENV !== 'production';
    const devIntercept = process.env.DEV_EMAIL_INTERCEPT;

    if (isDev && devIntercept) {
      this.logger.warn(
        `[DEV MODE] Email intercepted! Original: ${originalEmail} → Redirected to: ${devIntercept}`,
      );
      return devIntercept;
    }

    return originalEmail;
  }

  async sendVerificationEmail(
    email: string,
    token: string,
    name: string,
    businessName: string,
  ) {
    const recipient = this.getRecipient(email);
    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
    const htmlContent = this.getVerificationEmailTemplate(
      name,
      businessName,
      verificationUrl,
      email,
    );

    // Console log for development
    this.logger.log('\n' + '='.repeat(80));
    this.logger.log('📧 EMAIL VERIFICATION');
    this.logger.log('='.repeat(80));
    this.logger.log(`To: ${email}`);
    this.logger.log(`Name: ${name}`);
    this.logger.log(`Business: ${businessName}`);
    this.logger.log(`Verification URL: ${verificationUrl}`);
    this.logger.log(`Token: ${token.substring(0, 50)}...`);
    this.logger.log('='.repeat(80) + '\n');

    const fromEmail = process.env.EMAIL_FROM || 'noreply@gymbosslab.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'GymBossLab';
    const subject = 'Welcome to GymBossLab - Verify Your Email';

    try {
      switch (this.provider) {
        case 'resend':
          await this.sendViaResend(recipient, subject, htmlContent, fromEmail, fromName);
          break;
        case 'sendgrid':
          await sgMail.send({
            to: recipient,
            from: { email: fromEmail, name: fromName },
            subject,
            html: htmlContent,
          });
          this.logger.log(`✅ Verification email sent via SendGrid to ${recipient}`);
          break;
        case 'mailgun':
          await this.sendViaMailgun(recipient, subject, htmlContent, fromEmail, fromName);
          break;
        case 'brevo':
          await this.sendViaBrevo(recipient, subject, htmlContent, fromEmail, fromName);
          break;
        case 'smtp':
          if (!this.transporter) throw new Error('SMTP transporter not configured');
          await this.transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: recipient,
            subject,
            html: htmlContent,
          });
          this.logger.log(`✅ Verification email sent via SMTP to ${recipient}`);
          this.logger.log(`📧 View it at: http://localhost:8025`);
          break;
      }
    } catch (error) {
      this.logger.error(
        `❌ Failed to send verification email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
    * Send welcome email to new member
    */
  async sendWelcomeEmail(
    email: string,
    name: string,
    tenantId: string,
    membershipPlanName?: string,
    registrationDate?: string,
    startDate?: string,
    endDate?: string,
  ) {
    console.log('🎯 BACKEND: sendWelcomeEmail called with:', { email, name, registrationDate, startDate, endDate });
    await this.ensureSettingsLoaded();

    try {
      // Check if email notifications are enabled globally and welcome emails specifically
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          name: true,
          emailNotificationsEnabled: true,
          welcomeEmailEnabled: true,
          adminEmailRecipients: true,
        },
      });

      if (!tenant?.emailNotificationsEnabled || !tenant?.welcomeEmailEnabled) {
        this.logger.log(`Welcome email disabled for tenant ${tenantId}, skipping welcome email`);
        return;
      }

      const recipient = this.getRecipient(email);
      const template = await this.getEmailTemplate('welcome', tenantId);

      if (!template) {
        this.logger.warn(`No welcome email template found for tenant ${tenantId}`);
        return;
      }

      // If dates are not provided, try to fetch subscription data
      let finalRegistrationDate = registrationDate;
      let finalStartDate = startDate;
      let finalEndDate = endDate;

      console.log('📧 Welcome email input:', { email, startDate, endDate });

      if ((!finalStartDate || !finalEndDate) && email) {
        try {
          console.log('📧 Fetching subscription data for email:', email);
          // Find the user and their latest subscription
          const user = await this.prisma.user.findFirst({
            where: { email: email },
            include: {
              gymMemberSubscriptions: {
                include: { gymMembershipPlan: true },
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          });

          console.log('📧 Found user:', !!user, 'email match:', user?.email === email, 'subscriptions:', user?.gymMemberSubscriptions?.length || 0);

          if (user && user.gymMemberSubscriptions && user.gymMemberSubscriptions.length > 0) {
            const subscription = user.gymMemberSubscriptions[0];
            finalStartDate = finalStartDate || new Date(subscription.startDate).toLocaleDateString();
            finalEndDate = finalEndDate || new Date(subscription.endDate).toLocaleDateString();
            console.log('📧 Found subscription data for welcome email:', {
              startDate: finalStartDate,
              endDate: finalEndDate,
              rawStartDate: subscription.startDate,
              rawEndDate: subscription.endDate
            });
          } else {
            console.log('📧 No subscriptions found for user');
          }
        } catch (error) {
          console.warn('Could not fetch subscription data for welcome email:', error.message);
        }
      }

      const variables = {
        memberName: name,
        tenantName: tenant?.name || 'Our Gym',
        membershipPlan: membershipPlanName || 'Basic Membership',
        registrationDate: finalRegistrationDate || new Date().toLocaleDateString(),
        startDate: finalStartDate || new Date().toLocaleDateString(),
        endDate: finalEndDate || 'N/A',
        loginUrl: `${process.env.FRONTEND_URL}/auth/login`,
      };

      console.log('📧 WELCOME EMAIL FINAL VARIABLES:', {
        email,
        registrationDate: variables.registrationDate,
        startDate: variables.startDate,
        endDate: variables.endDate
      });

       const processedSubject = this.processTemplate(template.subject, variables);
       const htmlContent = this.processTemplate(template.htmlContent, variables);
       const textContent = template.textContent ? this.processTemplate(template.textContent, variables) : undefined;

       const fromEmail = this.settings?.fromEmail || process.env.EMAIL_FROM || 'noreply@gymbosslab.com';
       const fromName = this.settings?.fromName || process.env.EMAIL_FROM_NAME || 'GymBossLab';

       await this.sendEmail(recipient, processedSubject, htmlContent, textContent, fromEmail, fromName, 'welcome', tenantId, template.id);

      this.logger.log(`✅ Welcome email sent to ${recipient}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send welcome email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send renewal notification to member and tenant admins
   */
  async sendMembershipRenewalEmail(
    memberEmail: string,
    memberName: string,
    tenantId: string,
    membershipPlan: string,
    startDate: string,
    endDate: string,
    renewalDate: string,
  ) {
    await this.ensureSettingsLoaded();

    try {
      // Get tenant info
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          name: true,
          adminEmailRecipients: true,
          emailNotificationsEnabled: true,
          tenantNotificationEmailEnabled: true,
          users: {
            where: { role: 'OWNER' },
            select: { email: true },
            take: 1
          }
        },
      });

      // Use adminEmailRecipients if configured, otherwise fallback to owner's email
      let adminRecipients = tenant?.adminEmailRecipients;
      if (!adminRecipients?.length && tenant?.users?.[0]?.email) {
        adminRecipients = [tenant.users[0].email];
        this.logger.log(`Using owner email as fallback for admin notifications: ${tenant.users[0].email}`);
      }

      if (!adminRecipients?.length) {
        this.logger.warn(`No admin email recipients configured and no owner found for tenant ${tenantId}`);
        return;
      }

      // Check if email notifications are enabled globally and tenant notifications specifically
      if (!tenant!.emailNotificationsEnabled || !tenant!.tenantNotificationEmailEnabled) {
        this.logger.log(`Tenant notifications disabled for ${tenantId}, skipping renewal email`);
        return;
      }

      // Send email to member
      const memberRecipient = this.getRecipient(memberEmail);
      const memberTemplate = await this.getEmailTemplate('membership_renewal', tenantId);

      if (memberTemplate) {
        const memberVariables = {
          memberName,
          tenantName: tenant!.name,
          memberEmail,
          membershipPlan,
          startDate,
          endDate,
          renewalDate,
          dashboardUrl: `${process.env.FRONTEND_URL}/auth/login`,
        };

        const memberProcessedSubject = this.processTemplate(memberTemplate.subject, memberVariables);
        const memberHtmlContent = this.processTemplate(memberTemplate.htmlContent, memberVariables);
        const memberTextContent = memberTemplate.textContent ? this.processTemplate(memberTemplate.textContent, memberVariables) : undefined;

        const fromEmail = this.settings?.fromEmail || process.env.EMAIL_FROM || 'noreply@gymbosslab.com';
        const fromName = this.settings?.fromName || process.env.EMAIL_FROM_NAME || 'GymBossLab';

        await this.sendEmail(memberRecipient, memberProcessedSubject, memberHtmlContent, memberTextContent, fromEmail, fromName, 'membership_renewal', tenantId, memberTemplate.id);

        this.logger.log(`✅ Renewal email sent to member: ${memberEmail}`);
      }

      // Send email to tenant admins
      if (adminRecipients?.length) {
        const adminTemplate = await this.getEmailTemplate('membership_renewal', tenantId);

        if (adminTemplate) {
          const adminVariables = {
            memberName,
            tenantName: tenant!.name,
            memberEmail,
            membershipPlan,
            startDate,
            endDate,
            renewalDate,
            dashboardUrl: `${process.env.FRONTEND_URL}/members`,
          };

          const adminProcessedSubject = this.processTemplate(adminTemplate.subject, adminVariables);
          const adminHtmlContent = this.processTemplate(adminTemplate.htmlContent, adminVariables);
          const adminTextContent = adminTemplate.textContent ? this.processTemplate(adminTemplate.textContent, adminVariables) : undefined;

          const fromEmail = this.settings?.fromEmail || process.env.EMAIL_FROM || 'noreply@gymbosslab.com';
          const fromName = this.settings?.fromName || process.env.EMAIL_FROM_NAME || 'GymBossLab';

      for (const adminEmail of adminRecipients) {
            const adminRecipient = this.getRecipient(adminEmail);
            await this.sendEmail(adminRecipient, adminProcessedSubject, adminHtmlContent, adminTextContent, fromEmail, fromName, 'membership_renewal', tenantId, adminTemplate.id);
          }

          this.logger.log(`✅ Renewal admin emails sent for tenant: ${tenant!.name}`);
        }
      }

    } catch (error) {
      this.logger.error(`❌ Failed to send renewal email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
    * Send admin alert for new member signup
    */
  async sendNewMemberAlert(
    tenantName: string,
    memberName: string,
    memberEmail: string,
    membershipPlan: string,
    tenantId: string,
  ) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          name: true,
          emailNotificationsEnabled: true,
          tenantNotificationEmailEnabled: true,
          adminEmailRecipients: true,
          users: {
            where: { role: 'OWNER' },
            select: { email: true },
            take: 1
          }
        },
      });

      // Use adminEmailRecipients if configured, otherwise fallback to owner's email
      let adminRecipients = tenant?.adminEmailRecipients;
      if (!adminRecipients?.length && tenant?.users?.[0]?.email) {
        adminRecipients = [tenant.users[0].email];
        this.logger.log(`Using owner email as fallback for admin notifications: ${tenant.users[0].email}`);
      }

      if (!adminRecipients?.length) {
        this.logger.warn(`No admin email recipients configured and no owner found for tenant ${tenantId}`);
        return;
      }

      // Check if email notifications are enabled globally and tenant notifications specifically
      if (!tenant!.emailNotificationsEnabled || !tenant!.tenantNotificationEmailEnabled) {
        this.logger.log(`Tenant notifications disabled for ${tenantId}, skipping new member alert`);
        return;
      }

      const template = await this.getEmailTemplate('tenant_notification', tenantId);
      if (!template) {
        this.logger.warn(`No tenant notification template found for tenant ${tenantId}`);
        return;
      }

      const variables = {
        tenantName,
        memberName,
        memberEmail,
        membershipPlan,
        joinDate: new Date().toLocaleDateString(),
        dashboardUrl: `${process.env.FRONTEND_URL}/members`,
      };

      const processedSubject = this.processTemplate(template.subject, variables);
      const htmlContent = this.processTemplate(template.htmlContent, variables);
      const textContent = template.textContent ? this.processTemplate(template.textContent, variables) : undefined;

      const fromEmail = this.settings?.fromEmail || process.env.EMAIL_FROM || 'noreply@gymbosslab.com';
      const fromName = this.settings?.fromName || process.env.EMAIL_FROM_NAME || 'GymBossLab';

      for (const adminEmail of adminRecipients!) {
        const recipient = this.getRecipient(adminEmail);
        await this.sendEmail(recipient, processedSubject, htmlContent, textContent, fromEmail, fromName, 'tenant_notification', tenantId, template.id);
      }

      this.logger.log(`✅ New member alerts sent for tenant: ${tenantName}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send new member alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send admin alert for new tenant registration
   */
  async sendAdminAlert(
    tenantName: string,
    ownerEmail: string,
    tenantId: string,
  ) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { adminEmailRecipients: true },
      });

      if (!tenant?.adminEmailRecipients?.length) {
        this.logger.warn(`No admin email recipients configured for tenant ${tenantId}`);
        return;
      }

      const template = await this.getEmailTemplate('admin_alert', tenantId);
      if (!template) {
        this.logger.warn(`No admin alert template found for tenant ${tenantId}`);
        return;
      }

      const variables = {
        tenantName,
        ownerEmail,
        adminPanelUrl: `${process.env.FRONTEND_URL}/admin`,
      };

      const htmlContent = this.processTemplate(template.htmlContent, variables);
      const textContent = template.textContent ? this.processTemplate(template.textContent, variables) : undefined;

      const fromEmail = this.settings?.fromEmail || process.env.EMAIL_FROM || 'noreply@gymbosslab.com';
      const fromName = this.settings?.fromName || process.env.EMAIL_FROM_NAME || 'GymBossLab';

      for (const adminEmail of tenant!.adminEmailRecipients!) {
        const recipient = this.getRecipient(adminEmail);
        await this.sendEmail(recipient, template.subject, htmlContent, textContent, fromEmail, fromName, 'admin_alert', tenantId, template.id);
      }

      this.logger.log(`✅ Admin alerts sent for new tenant: ${tenantName}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send admin alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send global admin alert for system-wide events
   */
  async sendGlobalAdminAlert(
    subject: string,
    message: string,
    eventType: 'new_tenant' | 'system_alert' | 'security_event' = 'system_alert',
  ) {
    try {
      // Get system settings directly to avoid circular dependency
      const systemSettings = await this.prisma.systemSettings.findUnique({
        where: { id: 'system' },
        select: {
          globalAdminEmails: true,
          newTenantAlertsEnabled: true,
          systemAlertsEnabled: true,
          securityAlertsEnabled: true,
        },
      });

      const globalAdminEmails = systemSettings?.globalAdminEmails || [];

      if (!globalAdminEmails.length) {
        this.logger.warn('⚠️ No global admin emails configured for notifications');
        return;
      }

      // Check if alerts are enabled for this event type
      if (eventType === 'new_tenant') {
        const enabled = systemSettings?.newTenantAlertsEnabled ?? true;
        if (!enabled) {
          this.logger.log('ℹ️ New tenant alerts disabled, skipping notification');
          return;
        }
      }

      const variables = {
        subject,
        message,
        eventType,
        timestamp: new Date().toISOString(),
        adminPanelUrl: `${process.env.FRONTEND_URL}/admin`,
      };

      // Use a generic admin alert template or create a simple HTML message
      const htmlContent = this.createGlobalAdminAlertHtml(variables);
      const textContent = `System Alert: ${subject}\n\n${message}\n\nEvent Type: ${eventType}\nTimestamp: ${variables.timestamp}`;

      const fromEmail = this.settings?.fromEmail || process.env.EMAIL_FROM || 'noreply@gymbosslab.com';
      const fromName = this.settings?.fromName || process.env.EMAIL_FROM_NAME || 'GymBossLab System';

      for (const adminEmail of globalAdminEmails) {
        const recipient = this.getRecipient(adminEmail);
        await this.sendEmail(recipient, subject, htmlContent, textContent, fromEmail, fromName, 'system_alert', undefined, undefined);
      }

      this.logger.log(`✅ Global admin alerts sent to ${globalAdminEmails.length} recipients for: ${subject}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send global admin alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create HTML content for global admin alerts
   */
  private createGlobalAdminAlertHtml(variables: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #f97316 100%); padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🏢 GymBossLab System Alert</h1>
        </div>

        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px; padding: 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">${variables.subject}</h2>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #374151;"><strong>Message:</strong></p>
            <p style="margin: 10px 0 0 0; color: #1f2937;">${variables.message}</p>
          </div>

          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Event Type:</strong> ${variables.eventType}</p>
            <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${new Date(variables.timestamp).toLocaleString()}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${variables.adminPanelUrl}" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View Admin Panel</a>
          </div>

          <p style="color: #9ca3af; font-size: 13px; text-align: center; margin-top: 30px;">
            This is an automated system notification. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Send notification to tenant owner for new member
   */
  async sendTenantNotification(
    tenantId: string,
    memberName: string,
    memberEmail: string,
    membershipPlanName?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    try {
      // Check platform-level setting first
      const systemSettings = await this.prisma.systemSettings.findUnique({
        where: { id: 'system' },
        select: { tenantNotificationsEnabled: true },
      });

      if (!systemSettings?.tenantNotificationsEnabled) {
        this.logger.log(`Platform tenant notifications disabled, skipping notification for tenant ${tenantId}`);
        return;
      }

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          name: true,
          tenantSignupNotificationEnabled: true,
          adminEmailRecipients: true,
          users: { where: { role: 'OWNER' }, select: { email: true, firstName: true } }
        },
      });

      if (!tenant?.tenantSignupNotificationEnabled) {
        this.logger.log(`Tenant signup notifications disabled for tenant ${tenantId}`);
        return;
      }

      // Use adminEmailRecipients if configured, otherwise fallback to owner's email
      let adminRecipients = tenant?.adminEmailRecipients;
      if (!adminRecipients?.length && tenant?.users?.[0]?.email) {
        adminRecipients = [tenant.users[0].email];
        this.logger.log(`Using owner email as fallback for tenant notifications: ${tenant.users[0].email}`);
      }

      if (!adminRecipients?.length) {
        this.logger.warn(`No admin email recipients configured and no owner found for tenant ${tenantId}`);
        return;
      }

      const template = await this.getEmailTemplate('tenant_notification', tenantId);
      if (!template) {
        this.logger.warn(`No tenant notification template found for tenant ${tenantId}`);
        return;
      }

      const variables = {
        tenantName: tenant!.name,
        memberName,
        memberEmail,
        membershipPlan: membershipPlanName || 'Basic Membership',
        startDate: startDate ? startDate.toLocaleDateString() : 'N/A',
        endDate: endDate ? endDate.toLocaleDateString() : 'N/A',
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      };

      const processedSubject = this.processTemplate(template.subject, variables);
      const htmlContent = this.processTemplate(template.htmlContent, variables);
      const textContent = template.textContent ? this.processTemplate(template.textContent, variables) : undefined;

      const fromEmail = this.settings?.fromEmail || process.env.EMAIL_FROM || 'noreply@gymbosslab.com';
      const fromName = this.settings?.fromName || process.env.EMAIL_FROM_NAME || 'GymBossLab';

      for (const adminEmail of adminRecipients!) {
        const recipient = this.getRecipient(adminEmail);
        await this.sendEmail(recipient, processedSubject, htmlContent, textContent, fromEmail, fromName, 'tenant_notification', tenantId, template.id);
      }

      this.logger.log(`✅ Tenant notifications sent for new member: ${memberName}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send tenant notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generic email sending method with logging
   */
  private async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    textContent: string | undefined,
    fromEmail: string,
    fromName: string,
    templateType: string,
    tenantId?: string,
    templateId?: string,
  ) {
    const logEntry = await this.prisma.emailLog.create({
      data: {
        tenantId,
        recipientEmail: to,
        templateType,
        templateId,
        subject,
        status: 'pending',
        provider: this.provider,
      },
    });

    try {
      switch (this.provider) {
        case 'brevo':
          await this.sendViaBrevo(to, subject, htmlContent, fromEmail, fromName);
          break;
        case 'sendgrid':
          await sgMail.send({
            to,
            from: { email: fromEmail, name: fromName },
            subject,
            html: htmlContent,
            text: textContent,
          });
          break;
        case 'mailgun':
          await this.sendViaMailgun(to, subject, htmlContent, fromEmail, fromName);
          break;
        case 'resend':
          await this.sendViaResend(to, subject, htmlContent, fromEmail, fromName);
          break;
        case 'smtp':
          if (!this.transporter) throw new Error('SMTP transporter not configured');
          await this.transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            html: htmlContent,
            text: textContent,
          });
          break;
      }

      // Update log on success
      await this.prisma.emailLog.update({
        where: { id: logEntry.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

    } catch (error) {
      // Update log on failure
      await this.prisma.emailLog.update({
        where: { id: logEntry.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });
      throw error;
    }
  }

  /**
   * Get email template by type and tenant
   */
  private async getEmailTemplate(type: string, tenantId?: string) {
    // Try tenant-specific template first, then global template
    let template = await this.prisma.emailTemplate.findFirst({
      where: {
        templateType: type,
        tenantId: tenantId,
        isActive: true,
      },
    });

    if (!template) {
      template = await this.prisma.emailTemplate.findFirst({
        where: {
          templateType: type,
          tenantId: null, // Global template
          isActive: true,
        },
      });
    }

    return template;
  }

  /**
   * Process template variables
   */
  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value || '');
    }
    return processed;
  }

  private getVerificationEmailTemplate(
    name: string,
    businessName: string,
    verificationUrl: string,
    originalEmail?: string,
  ): string {
    const isDev = process.env.NODE_ENV !== 'production';
    const devNotice =
      isDev && process.env.DEV_EMAIL_INTERCEPT
        ? `<div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
           <strong>⚠️ DEV MODE:</strong> This email was originally intended for <strong>${originalEmail}</strong>
         </div>`
        : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${devNotice}
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #f97316 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 32px; margin: 0;">GymBossLab</h1>
        </div>
        
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">Welcome to GymBossLab! 🏋️</h2>
          
          <p>Hi <strong>${name}</strong>,</p>
          
          <p>We're excited to have <strong>${businessName}</strong> join our platform!</p>
          
          <p>To activate your account and start managing your gym, please verify your email address:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Verify Email Address</a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="background: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px;">${verificationUrl}</p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">⏱️ This link expires in <strong>24 hours</strong>.</p>
          
          <p style="color: #6b7280; font-size: 14px;">If you didn't create this account, you can safely ignore this email.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 13px;">
          <p>Questions? Reply to this email or visit our <a href="https://gymbosslab.com/support" style="color: #8b5cf6;">support center</a>.</p>
          <p style="margin-top: 10px;">Best regards,<br><strong>The GymBossLab Team</strong></p>
        </div>
      </body>
      </html>
    `;
  }

  // Provider-specific implementations
  
  private async sendViaResend(
    to: string,
    subject: string,
    html: string,
    fromEmail: string,
    fromName: string,
  ) {
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );
    this.logger.log(`✅ Verification email sent via Resend to ${to}`);
    return response.data;
  }

  private async sendViaMailgun(
    to: string,
    subject: string,
    html: string,
    fromEmail: string,
    fromName: string,
  ) {
    const domain = process.env.MAILGUN_DOMAIN;
    const apiKey = process.env.MAILGUN_API_KEY;
    
    const formData = new URLSearchParams();
    formData.append('from', `${fromName} <${fromEmail}>`);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', html);

    const response = await axios.post(
      `https://api.mailgun.net/v3/${domain}/messages`,
      formData,
      {
        auth: {
          username: 'api',
          password: apiKey!,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    this.logger.log(`✅ Verification email sent via Mailgun to ${to}`);
    return response.data;
  }

  private async sendViaBrevo(
    to: string,
    subject: string,
    html: string,
    fromEmail: string,
    fromName: string,
  ) {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY!,
          'Content-Type': 'application/json',
        },
      },
    );
    this.logger.log(`✅ Verification email sent via Brevo to ${to}`);
    return response.data;
  }
}
