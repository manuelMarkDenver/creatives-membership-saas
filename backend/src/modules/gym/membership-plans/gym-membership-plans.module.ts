import { Module } from '@nestjs/common';
import { GymMembershipPlansController } from './gym-membership-plans.controller';
import { GymMembershipPlansService } from './gym-membership-plans.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { SupabaseModule } from '../../../core/supabase/supabase.module';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [GymMembershipPlansController],
  providers: [GymMembershipPlansService],
  exports: [GymMembershipPlansService],
})
export class GymMembershipPlansModule {}
