import { Module } from '@nestjs/common';
import { GymLocationsController } from './gym-locations.controller';
import { GymLocationsService } from './gym-locations.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { SubscriptionsModule } from '../../subscriptions/subscriptions.module';

@Module({
  imports: [PrismaModule, SupabaseModule, SubscriptionsModule],
  controllers: [GymLocationsController],
  providers: [GymLocationsService],
  exports: [GymLocationsService],
})
export class GymLocationsModule {}
