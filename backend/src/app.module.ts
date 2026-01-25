import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './core/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { NotificationsModule } from './core/notifications/notifications.module';
import { TenantsModule } from './core/tenants/tenants.module';
import { TenantMiddleware } from './core/middleware/tenants.middleware';
import { UsersModule } from './core/users/user.module';
import { AuthModule } from './core/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { StatsModule } from './modules/stats/stats.module';
import { PlansModule } from './modules/plans/plans.module';
import { GymModule } from './modules/gym/gym.module';
import { BusinessUnitsModule } from './modules/business-units/business-units.module';
import { SystemSettingsModule } from './core/system-settings/system-settings.module';
import { EmailModule } from './core/email/email.module';
import { AccessModule } from './modules/access/access.module';
import { DailyModule } from './modules/daily/daily.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(__dirname, '../../.env.local'),
    }),
    NotificationsModule,
    TenantsModule,
    UsersModule,
    AuthModule,
    BranchesModule,
    SubscriptionsModule,
    StatsModule,
    PlansModule,
    GymModule,
    BusinessUnitsModule,
    SystemSettingsModule,
    EmailModule,
    AccessModule,
    DailyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
