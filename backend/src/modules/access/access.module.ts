import { Module } from '@nestjs/common';
import { AccessController, TerminalsController } from './access.controller';
import { AccessService } from './access.service';
import { TerminalsService } from './terminals.service';
import { EventsService } from './events.service';
import { CardAssignmentService } from './card-assignment.service';

@Module({
  controllers: [AccessController, TerminalsController],
  providers: [AccessService, TerminalsService, EventsService, CardAssignmentService],
  exports: [TerminalsService, EventsService, CardAssignmentService],
})
export class AccessModule {}