import { Module, forwardRef } from '@nestjs/common';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';
import { TerminalsService } from './terminals.service';
import { EventsService } from './events.service';
import { CardAssignmentService } from './card-assignment.service';
import { TapCooldownRepository } from './tap-cooldown.repository';
import { TapCooldownService } from './tap-cooldown.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { DailyModule } from '../daily/daily.module';

@Module({
  imports: [PrismaModule, forwardRef(() => DailyModule)],
  controllers: [AccessController],
  providers: [
    AccessService,
    TerminalsService,
    EventsService,
    CardAssignmentService,
    TapCooldownRepository,
    TapCooldownService,
  ],
  exports: [TerminalsService, EventsService, CardAssignmentService],
})
export class AccessModule {
  constructor() {
    console.log('✅ AccessModule loaded');
  }
}
