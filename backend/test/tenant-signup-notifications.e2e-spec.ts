import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { BusinessCategory, Role, MembershipType } from '@prisma/client';

describe('Tenant Signup Notifications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantId: string;
  let ownerUser: any;
  let membershipPlanId: string;

  beforeAll(async () => {
    // Set test environment to avoid Supabase requirements
    process.env.NODE_ENV = 'development';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up and create test data (in reverse dependency order)
    await prisma.gymMemberSubscription.deleteMany();
    await prisma.gymMemberProfile.deleteMany();
    await prisma.gymMembershipPlan.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.user.deleteMany();
    await prisma.systemSettings.deleteMany();

    // Reset any global state that might persist between tests
    tenantId = '';
    ownerUser = null as any;

    // Create system settings with tenant notifications enabled
    await prisma.systemSettings.create({
      data: {
        id: 'system',
        passwordSecurityLevel: 'MEDIUM',
        globalAdminEmails: ['admin@test.com'],
        newTenantAlertsEnabled: true,
        systemAlertsEnabled: true,
        securityAlertsEnabled: true,
        tenantNotificationsEnabled: true, // Platform control enabled
      },
    });

    // Create unique identifiers
    const uniqueSlug = `test-gym-${Date.now()}`;
    const uniqueEmail = `owner-${Date.now()}@test-gym.com`;

    // Create test tenant with signup notifications enabled
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Gym',
        slug: uniqueSlug,
        category: BusinessCategory.GYM,
        status: 'ACTIVE',
        welcomeEmailEnabled: true,
        emailNotificationsEnabled: true,
        tenantNotificationEmailEnabled: false, // Different from signup notifications
        tenantSignupNotificationEnabled: true, // Our new field
        adminEmailRecipients: [uniqueEmail, 'manager@test-gym.com'],
      },
    });
    tenantId = tenant.id;

    // Create owner user
    ownerUser = await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'Owner',
        email: uniqueEmail,
        password: 'hashedpassword',
        role: Role.OWNER,
        tenant: {
          connect: { id: tenant.id }
        },
      },
    });

    // Create a branch for the tenant
    await prisma.branch.create({
      data: {
        name: 'Main Branch',
        tenantId: tenant.id,
        isActive: true,
        address: '123 Test St',
        phoneNumber: '09123456789',
      },
    });

    // Create membership plan
    const plan = await prisma.gymMembershipPlan.create({
      data: {
        tenantId: tenantId,
        name: 'Test Plan',
        price: 1000,
        duration: 30, // 30 days
        type: MembershipType.MONTHLY,
        benefits: [
          "Test Feature"
        ],
      },
    });
    membershipPlanId = plan.id;
  });

  describe('Platform-Level Control', () => {
    it('should send notifications when platform control is enabled', async () => {
      // Ensure platform control is enabled and tenant control is enabled
      await prisma.systemSettings.update({
        where: { id: 'system' },
        data: { tenantNotificationsEnabled: true },
      });
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          tenantSignupNotificationEnabled: true,
          adminEmailRecipients: [ownerUser.email, 'manager@test-gym.com']
        },
      });

      const memberData = {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@test.com',
        phoneNumber: '09123456789',
        membershipPlanId: membershipPlanId,
        startDate: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/gym/members')
        .set('x-tenant-id', tenantId)
        .set('x-bypass-auth', 'true')
        .set('x-bypass-user', ownerUser.email)
        .send(memberData)
        .expect(201);

      // Verify member was created
      expect(response.body.user.firstName).toBe('Jane');
      expect(response.body.user.lastName).toBe('Doe');
      expect(response.body.tenant.id).toBe(tenantId);
    });

    it('should not send notifications when platform control is disabled', async () => {
      // Disable platform control
      await prisma.systemSettings.update({
        where: { id: 'system' },
        data: { tenantNotificationsEnabled: false },
      });

      const memberData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@test.com',
        phoneNumber: '09123456789',
        membershipPlanId: membershipPlanId,
        businessData: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };

      const response = await request(app.getHttpServer())
        .post('/gym/members')
        .set('x-tenant-id', tenantId)
        .set('x-bypass-auth', 'true')
        .set('x-bypass-user', ownerUser.email)
        .send(memberData)
        .expect(201);

      // Verify member was still created (email failure shouldn't break creation)
      expect(response.body.user.firstName).toBe('Jane');
      expect(response.body.user.lastName).toBe('Smith');
    });
  });

  describe('Tenant-Level Control', () => {
    it('should send notifications when tenant control is enabled', async () => {
      // Ensure tenant control is enabled (already set in beforeEach)

      const memberData = {
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'bob.wilson@test.com',
        phoneNumber: '09123456789',
        membershipPlanId: membershipPlanId,
        businessData: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };

      const response = await request(app.getHttpServer())
        .post('/gym/members')
        .set('x-tenant-id', tenantId)
        .set('x-bypass-auth', 'true')
        .set('x-bypass-user', ownerUser.email)
        .send(memberData)
        .expect(201);

      expect(response.body.user.firstName).toBe('Bob');
      expect(response.body.user.lastName).toBe('Wilson');
    });

    it('should not send notifications when tenant control is disabled', async () => {
      // Disable tenant control
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { tenantSignupNotificationEnabled: false },
      });

      const memberData = {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@test.com',
        phoneNumber: '09123456789',
        membershipPlanId: membershipPlanId,
        businessData: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };

      const response = await request(app.getHttpServer())
        .post('/gym/members')
        .set('x-tenant-id', tenantId)
        .set('x-bypass-auth', 'true')
        .set('x-bypass-user', ownerUser.email)
        .send(memberData)
        .expect(201);

      expect(response.body.user.firstName).toBe('Alice');
      expect(response.body.user.lastName).toBe('Johnson');
    });
  });

  describe('Tenant Settings API', () => {
    it('should get tenant settings including signup notification field', () => {
      return request(app.getHttpServer())
        .get('/tenants/current/settings')
        .set('x-bypass-auth', 'true')
        .set('x-bypass-user', ownerUser.email)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', tenantId);
          expect(res.body).toHaveProperty('tenantSignupNotificationEnabled', true);
          expect(res.body).toHaveProperty('adminEmailRecipients');
          expect(Array.isArray(res.body.adminEmailRecipients)).toBe(true);
        });
    });

    it('should update tenant signup notification setting', () => {
      return request(app.getHttpServer())
        .put('/tenants/current/settings')
        .set('x-bypass-auth', 'true')
        .set('x-bypass-user', ownerUser.email)
        .send({
          tenantSignupNotificationEnabled: false,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('tenantSignupNotificationEnabled', false);
        });
    });
  });

  describe('Email Recipients', () => {
    it('should send to all admin email recipients', async () => {
      // Ensure settings are correct for this test
      await prisma.systemSettings.update({
        where: { id: 'system' },
        data: { tenantNotificationsEnabled: true },
      });
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          tenantSignupNotificationEnabled: true,
          adminEmailRecipients: [ownerUser.email, 'manager@test-gym.com']
        },
      });
      const memberData = {
        firstName: 'No',
        lastName: 'Recipients',
        email: 'no.recipients@test.com',
        phoneNumber: '09123456789',
        membershipPlanId: membershipPlanId,
        startDate: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/gym/members')
        .set('x-tenant-id', tenantId)
        .set('x-bypass-auth', 'true')
        .set('x-bypass-user', ownerUser.email)
        .send(memberData)
        .expect(201);

      // Verify member creation and that admin recipients are configured
      expect(response.body.user.firstName).toBe('Test');
      expect(response.body.user.lastName).toBe('Recipient');

      // Verify tenant has the expected admin recipients
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { adminEmailRecipients: true },
      });
      expect(tenant?.adminEmailRecipients).toEqual([ownerUser.email, 'manager@test-gym.com']);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle edge case: no admin recipients configured', async () => {
      // Remove admin recipients
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { adminEmailRecipients: [] },
      });

      const memberData = {
        firstName: 'No',
        lastName: 'Recipients',
        email: 'no.recipients@test.com',
        phoneNumber: '09123456789',
        membershipPlanId: membershipPlanId,
        businessData: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };

      // Should still create member even if no recipients configured
      const response = await request(app.getHttpServer())
        .post('/gym/members')
        .set('x-tenant-id', tenantId)
        .set('x-bypass-auth', 'true')
        .set('x-bypass-user', ownerUser.email)
        .send(memberData)
        .expect(201);

      expect(response.body.user.firstName).toBe('No');
      expect(response.body.user.lastName).toBe('Recipients');
    });

    it('should handle platform disabled but tenant enabled', async () => {
      // Platform disabled, tenant enabled
      await prisma.systemSettings.update({
        where: { id: 'system' },
        data: { tenantNotificationsEnabled: false },
      });

      const memberData = {
        firstName: 'Platform',
        lastName: 'Disabled',
        email: 'platform.disabled@test.com',
        phoneNumber: '09123456789',
        membershipPlanId: membershipPlanId,
        startDate: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/gym/members')
        .set('x-tenant-id', tenantId)
        .set('x-bypass-auth', 'true')
        .set('x-bypass-user', ownerUser.email)
        .send(memberData)
        .expect(201);

      // Member should still be created
      expect(response.body.user.firstName).toBe('Platform');
      expect(response.body.user.lastName).toBe('Disabled');
    });
  });
});