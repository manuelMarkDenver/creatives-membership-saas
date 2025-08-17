import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './core/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from './core/notifications/notifications.module';
import { TenantsModule } from './core/tenants/tenants.module';
import { TenantMiddleware } from './core/middleware/tenants.middleware';
import { UsersModule } from './core/users/user.module';
import { AuthModule } from './core/auth/auth.module';
import { SupabaseModule } from './core/supabase/supabase.module';
import { BranchesModule } from './modules/branches/branches.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { StatsModule } from './modules/stats/stats.module';
import { PlansModule } from './modules/plans/plans.module';
import { MembershipPlansModule } from './modules/membership-plans/membership-plans.module';
import { GymModule } from './modules/gym/gym.module';
import { BusinessUnitsModule } from './modules/business-units/business-units.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' 
        ? ['../.env.prod', '../.env']
        : process.env.NODE_ENV === 'test'
        ? ['../.env.test', '../.env.local', '../.env']
        : ['../.env.local', '../.env']
    }),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    NotificationsModule,
    BranchesModule,
    SubscriptionsModule,
    StatsModule,
    PlansModule,
    MembershipPlansModule,
    GymModule,
    BusinessUnitsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
