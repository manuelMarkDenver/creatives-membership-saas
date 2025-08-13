import { Module } from '@nestjs/common';
import { BusinessUnitsController } from './business-units.controller';
import { BusinessUnitsService } from './business-units.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SupabaseModule } from '../../core/supabase/supabase.module';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [BusinessUnitsController],
  providers: [BusinessUnitsService],
  exports: [BusinessUnitsService],
})
export class BusinessUnitsModule {}
