import sgMail from '@sendgrid/mail';
import * as nodemailer from 'nodemailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private useSendGrid = false;

  constructor() {
    const isDev = process.env.NODE_ENV !== 'production';
    const sendGridKey = process.env.SENDGRID_API_KEY;

    if (!isDev && sendGridKey) {
      // Production: Use SendGrid
      sgMail.setApiKey(sendGridKey);
      this.useSendGrid = true;
      this.logger.log('✅ Email service initialized with SendGrid (production)');
    } else {
      // Development: Use Mailpit/SMTP
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '1025'),
        secure: false, // Mailpit doesn't use TLS
        ignoreTLS: true,
      });
      this.logger.log(
        `✅ Email service initialized with SMTP (${process.env.SMTP_HOST || 'localhost'}:${process.env.SMTP_PORT || '1025'})`,
      );
      this.logger.log('📧 View emails at: http://localhost:8025');
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

    try {
      if (this.useSendGrid) {
        // Production: SendGrid
        await sgMail.send({
          to: recipient,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || 'noreply@gymbosslab.com',
            name: process.env.SENDGRID_FROM_NAME || 'GymBossLab',
          },
          subject: 'Welcome to GymBossLab - Verify Your Email',
          html: htmlContent,
        });
        this.logger.log(`✅ Verification email sent via SendGrid to ${recipient}`);
      } else if (this.transporter) {
        // Development: SMTP/Mailpit
        await this.transporter.sendMail({
          from: '"GymBossLab" <noreply@gymbosslab.com>',
          to: recipient,
          subject: 'Welcome to GymBossLab - Verify Your Email',
          html: htmlContent,
        });
        this.logger.log(`✅ Verification email sent via SMTP to ${recipient}`);
        this.logger.log(`📧 View it at: http://localhost:8025`);
      } else {
        throw new Error('No email transport configured');
      }
    } catch (error) {
      this.logger.error(
        `❌ Failed to send verification email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
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
}
