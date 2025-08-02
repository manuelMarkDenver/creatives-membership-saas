import { Module } from '@nestjs/common';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { NotificationsModule } from 'src/core/notifications/notifications.module';
import { TenantsModule } from 'src/core/tenants/tenants.module';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [PrismaModule, NotificationsModule, TenantsModule, AuthModule, SupabaseModule], // <-- Needed here
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
