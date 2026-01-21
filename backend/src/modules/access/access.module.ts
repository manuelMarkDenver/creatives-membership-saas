import { Module } from '@nestjs/common';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';
import { TerminalsService } from './terminals.service';
import { EventsService } from './events.service';
import { CardAssignmentService } from './card-assignment.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AccessController],
  providers: [
    AccessService,
    TerminalsService,
    EventsService,
    CardAssignmentService,
  ],
  exports: [TerminalsService, EventsService, CardAssignmentService],
})
export class AccessModule {
  constructor() {
    console.log('✅ AccessModule loaded');
  }
}
