import { Module, forwardRef } from '@nestjs/common';
import { DailyController } from './daily.controller';
import { DailyService } from './daily.service';
import { DailyRepository } from './repositories/daily.repository';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AccessModule } from '../access/access.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AccessModule)],
  controllers: [DailyController],
  providers: [DailyService, DailyRepository],
  exports: [DailyService, DailyRepository],
})
export class DailyModule {}