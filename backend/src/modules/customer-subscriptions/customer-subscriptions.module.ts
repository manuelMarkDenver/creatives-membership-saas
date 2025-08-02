import { Module } from '@nestjs/common';
import { CustomerSubscriptionsController } from './customer-subscriptions.controller';
import { CustomerSubscriptionsService } from './customer-subscriptions.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SupabaseModule } from '../../core/supabase/supabase.module';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [CustomerSubscriptionsController],
  providers: [CustomerSubscriptionsService],
  exports: [CustomerSubscriptionsService],
})
export class CustomerSubscriptionsModule {}
