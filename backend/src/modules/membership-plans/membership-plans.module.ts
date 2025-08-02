import { Module } from '@nestjs/common';
import { MembershipPlansController } from './membership-plans.controller';
import { MembershipPlansService } from './membership-plans.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SupabaseModule } from '../../core/supabase/supabase.module';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [MembershipPlansController],
  providers: [MembershipPlansService],
  exports: [MembershipPlansService],
})
export class MembershipPlansModule {}
