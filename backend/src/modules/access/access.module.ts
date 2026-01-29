import { Module, forwardRef } from '@nestjs/common';
import { AccessController } from './access.controller';
import { InventoryCardsController } from './inventory-cards.controller';
import { TerminalsAdminController } from './terminals-admin.controller';
import { AccessService } from './access.service';
import { TerminalsService } from './terminals.service';
import { EventsService } from './events.service';
import { CardAssignmentService } from './card-assignment.service';
import { TapCooldownRepository } from './tap-cooldown.repository';
import { TapCooldownService } from './tap-cooldown.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { DailyModule } from '../daily/daily.module';
import { InventoryCardsService } from './inventory-cards.service';
import { AccessRateLimitGuard } from './guards/access-rate-limit.guard';

@Module({
  imports: [PrismaModule, forwardRef(() => DailyModule)],
  controllers: [AccessController, InventoryCardsController, TerminalsAdminController],
  providers: [
    AccessService,
    TerminalsService,
    EventsService,
    CardAssignmentService,
    TapCooldownRepository,
    TapCooldownService,
    InventoryCardsService,
    AccessRateLimitGuard,
  ],
  exports: [TerminalsService, EventsService, CardAssignmentService],
})
export class AccessModule {
}
