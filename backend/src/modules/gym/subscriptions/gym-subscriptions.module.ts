import { Module } from '@nestjs/common';
import { GymSubscriptionsController } from './gym-subscriptions.controller';
import { GymSubscriptionsService } from './gym-subscriptions.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { SupabaseModule } from '../../../core/supabase/supabase.module';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [GymSubscriptionsController],
  providers: [GymSubscriptionsService],
  exports: [GymSubscriptionsService],
})
export class GymSubscriptionsModule {}
