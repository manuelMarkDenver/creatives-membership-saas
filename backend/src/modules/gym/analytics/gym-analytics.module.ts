import { Module } from '@nestjs/common';
import { GymAnalyticsController } from './gym-analytics.controller';
import { GymAnalyticsService } from './gym-analytics.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GymAnalyticsController],
  providers: [GymAnalyticsService],
  exports: [GymAnalyticsService],
})
export class GymAnalyticsModule {}
