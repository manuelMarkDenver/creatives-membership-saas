import { Module } from '@nestjs/common';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { NotificationsModule } from 'src/core/notifications/notifications.module';
import { TenantsModule } from 'src/core/tenants/tenants.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    TenantsModule,
    AuthModule,
    StorageModule, // Now using Wasabi instead of Supabase
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
