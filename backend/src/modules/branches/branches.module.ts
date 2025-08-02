import { Module } from '@nestjs/common';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../core/auth/auth.module';
import { SupabaseModule } from '../../core/supabase/supabase.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [PrismaModule, AuthModule, SupabaseModule, SubscriptionsModule],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
