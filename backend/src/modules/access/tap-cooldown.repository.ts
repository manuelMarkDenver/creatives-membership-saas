import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class TapCooldownRepository {
  constructor(private prisma: PrismaService) {}

  findByTerminalAndCard(terminalId: string, cardUid: string) {
    return this.prisma.tapCooldown.findUnique({
      where: {
        terminalId_cardUid: {
          terminalId,
          cardUid,
        },
      },
    });
  }

  upsertLastTapAt(terminalId: string, cardUid: string, lastTapAt: Date) {
    return this.prisma.tapCooldown.upsert({
      where: {
        terminalId_cardUid: {
          terminalId,
          cardUid,
        },
      },
      update: {
        lastTapAt,
      },
      create: {
        terminalId,
        cardUid,
        lastTapAt,
      },
    });
  }
}
