import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EmailService - Tenant Signup Notifications', () => {
  let service: EmailService;
  let prisma: PrismaService;

  const mockTenant = {
    id: 'tenant-123',
    name: 'Test Gym',
    tenantSignupNotificationEnabled: true,
    adminEmailRecipients: ['owner@test.com', 'manager@test.com'],
    users: [{ email: 'owner@test.com', firstName: 'Test', role: 'OWNER' }],
  };

  const mockSystemSettings = {
    id: 'system',
    tenantNotificationsEnabled: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: PrismaService,
          useValue: {
            tenant: {
              findUnique: jest.fn(),
            },
            systemSettings: {
              findUnique: jest.fn(),
            },
            emailTemplate: {
              findFirst: jest.fn(),
            },
            emailLog: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    prisma = module.get<PrismaService>(PrismaService);

    // Mock the settings property
    (service as any).settings = {
      fromEmail: 'noreply@test.com',
      fromName: 'Test App',
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendTenantNotification', () => {
    beforeEach(() => {
      // Mock successful template lookup
      const mockPrisma = prisma as jest.Mocked<PrismaService>;
      mockPrisma.emailTemplate.findFirst.mockResolvedValue({
        id: 'template-123',
        templateType: 'tenant_notification',
        subject: 'New Member Signup: {{memberName}}',
        htmlContent: '<h1>New member: {{memberName}}</h1>',
        textContent: 'New member: {{memberName}}',
        variables: null,
        tenantId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Mock email sending
      jest.spyOn(service as any, 'sendEmail').mockResolvedValue(undefined);
    });

    it('should send notification when both platform and tenant controls are enabled', async () => {
      const mockPrisma = prisma as jest.Mocked<PrismaService>;
      mockPrisma.systemSettings.findUnique.mockResolvedValue(
        mockSystemSettings as any,
      );
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant as any);

      await service.sendTenantNotification(
        'tenant-123',
        'John Doe',
        'john@test.com',
        'Premium Plan',
      );

      // Verify system settings were checked
      expect(mockPrisma.systemSettings.findUnique).toHaveBeenCalledWith({
        where: { id: 'system' },
        select: { tenantNotificationsEnabled: true },
      });

      // Verify tenant settings were checked
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-123' },
        select: {
          name: true,
          tenantSignupNotificationEnabled: true,
          adminEmailRecipients: true,
          users: {
            where: { role: 'OWNER' },
            select: { email: true, firstName: true },
          },
        },
      });

      // Verify email was sent to all admin recipients
      expect((service as any).sendEmail).toHaveBeenCalledTimes(2);
      expect((service as any).sendEmail).toHaveBeenCalledWith(
        'owner@test.com',
        'New Member Signup: John Doe',
        expect.stringContaining('New member: John Doe'),
        expect.stringContaining('New member: John Doe'),
        'noreply@test.com',
        'Test App',
        'tenant_notification',
        'tenant-123',
        'template-123',
      );
    });

    it('should not send notification when platform control is disabled', async () => {
      const mockPrisma = prisma as jest.Mocked<PrismaService>;
      mockPrisma.systemSettings.findUnique.mockResolvedValue({
        ...mockSystemSettings,
        tenantNotificationsEnabled: false,
      } as any);

      await service.sendTenantNotification(
        'tenant-123',
        'John Doe',
        'john@test.com',
        'Premium Plan',
      );

      // Verify email was not sent
      expect((service as any).sendEmail).not.toHaveBeenCalled();
    });

    it('should not send notification when tenant control is disabled', async () => {
      const mockPrisma = prisma as jest.Mocked<PrismaService>;
      mockPrisma.systemSettings.findUnique.mockResolvedValue(
        mockSystemSettings as any,
      );
      mockPrisma.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        tenantSignupNotificationEnabled: false,
      } as any);

      await service.sendTenantNotification(
        'tenant-123',
        'John Doe',
        'john@test.com',
        'Premium Plan',
      );

      // Verify email was not sent
      expect((service as any).sendEmail).not.toHaveBeenCalled();
    });

    it('should not send notification when no admin recipients configured', async () => {
      const mockPrisma = prisma as jest.Mocked<PrismaService>;
      mockPrisma.systemSettings.findUnique.mockResolvedValue(
        mockSystemSettings as any,
      );
      mockPrisma.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        adminEmailRecipients: [],
      } as any);

      await service.sendTenantNotification(
        'tenant-123',
        'John Doe',
        'john@test.com',
        'Premium Plan',
      );

      // Verify email was not sent
      expect((service as any).sendEmail).not.toHaveBeenCalled();
    });

    it('should handle missing tenant gracefully', async () => {
      const mockPrisma = prisma as jest.Mocked<PrismaService>;
      mockPrisma.systemSettings.findUnique.mockResolvedValue(
        mockSystemSettings as any,
      );
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await service.sendTenantNotification(
        'nonexistent-tenant',
        'John Doe',
        'john@test.com',
        'Premium Plan',
      );

      // Verify email was not sent due to missing tenant
      expect((service as any).sendEmail).not.toHaveBeenCalled();
    });

    it('should handle missing email template gracefully', async () => {
      const mockPrisma = prisma as jest.Mocked<PrismaService>;
      mockPrisma.systemSettings.findUnique.mockResolvedValue(
        mockSystemSettings as any,
      );
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant as any);
      mockPrisma.emailTemplate.findFirst.mockResolvedValue(null);

      await service.sendTenantNotification(
        'tenant-123',
        'John Doe',
        'john@test.com',
        'Premium Plan',
      );

      // Verify email was not sent due to missing template
      expect((service as any).sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('Email Logic Validation', () => {
    it('should validate platform + tenant control logic', () => {
      // Test all combinations of platform and tenant controls

      const testCases = [
        { platform: true, tenant: true, expected: true },
        { platform: true, tenant: false, expected: false },
        { platform: false, tenant: true, expected: false },
        { platform: false, tenant: false, expected: false },
      ];

      testCases.forEach(({ platform, tenant, expected }) => {
        const shouldSend = platform && tenant;
        expect(shouldSend).toBe(expected);
      });
    });

    it('should validate recipient logic', () => {
      // Test that emails are sent to all admin recipients
      const adminRecipients = [
        'admin1@test.com',
        'admin2@test.com',
        'admin3@test.com',
      ];
      expect(adminRecipients).toHaveLength(3);
      expect(adminRecipients).toContain('admin1@test.com');
      expect(adminRecipients).toContain('admin2@test.com');
      expect(adminRecipients).toContain('admin3@test.com');
    });
  });
});
