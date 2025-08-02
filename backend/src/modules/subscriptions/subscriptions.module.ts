import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../core/auth/auth.module';
import { SupabaseModule } from '../../core/supabase/supabase.module';

@Module({
  imports: [PrismaModule, AuthModule, SupabaseModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService], // Export so other modules can use it
})
export class SubscriptionsModule {}
