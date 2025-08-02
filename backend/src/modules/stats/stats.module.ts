import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../core/auth/auth.module';
import { SupabaseModule } from '../../core/supabase/supabase.module';

@Module({
  imports: [PrismaModule, AuthModule, SupabaseModule],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
