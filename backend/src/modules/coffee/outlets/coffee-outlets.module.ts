import { Module } from '@nestjs/common';
import { CoffeeOutletsController } from './coffee-outlets.controller';
import { BranchesModule } from '../../branches/branches.module';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { SubscriptionsModule } from '../../subscriptions/subscriptions.module';

@Module({
  imports: [PrismaModule, SupabaseModule, SubscriptionsModule, BranchesModule],
  controllers: [CoffeeOutletsController],
  providers: [],
  exports: [],
})
export class CoffeeOutletsModule {}
