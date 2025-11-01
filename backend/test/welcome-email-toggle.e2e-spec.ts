import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { BusinessCategory, Role } from '@prisma/client';

describe('Welcome Email Toggle (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantId: string;
  let ownerUser: any;

  beforeAll(async () => {
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
    // Clean up and create test tenant
    await prisma.tenant.deleteMany();
    await prisma.user.deleteMany();

    // Create test tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Gym',
        slug: 'test-gym',
        category: BusinessCategory.GYM,
        status: 'ACTIVE',
        welcomeEmailEnabled: true, // Default to enabled
        emailNotificationsEnabled: true,
        adminEmailRecipients: [],
      },
    });
    tenantId = tenant.id;

    // Create owner user
    ownerUser = await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'Owner',
        email: 'owner@test-gym.com',
        password: 'hashedpassword',
        role: Role.OWNER,
        tenantId: tenant.id,
        isActive: true,
      },
    });
  });

  describe('Tenant Settings API', () => {
    it('should get tenant settings', () => {
      return request(app.getHttpServer())
        .get('/tenants/current/settings')
        .set('x-bypass-auth', 'true')
        .set('x-bypass-user', ownerUser.email)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', tenantId);
          expect(res.body).toHaveProperty('name', 'Test Gym');
          expect(res.body).toHaveProperty('welcomeEmailEnabled', true);
          expect(res.body).toHaveProperty('emailNotificationsEnabled', true);
        });
    });

    it('should update welcome email settings', () => {
      return request(app.getHttpServer())
        .put('/tenants/current/settings')
        .set('x-bypass-auth', 'true')
        .set('x-bypass-user', ownerUser.email)
        .send({
          welcomeEmailEnabled: false,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('welcomeEmailEnabled', false);
          expect(res.body).toHaveProperty('emailNotificationsEnabled', true);
        });
    });

    it('should not allow non-owner to update settings', () => {
      return request(app.getHttpServer())
        .put('/tenants/current/settings')
        .set('x-bypass-auth', 'true')
        .set('x-bypass-user', 'non-owner@test.com')
        .send({
          welcomeEmailEnabled: false,
        })
        .expect(403);
    });
  });
});