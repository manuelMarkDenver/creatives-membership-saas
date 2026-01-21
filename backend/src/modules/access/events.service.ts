import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async logEvent(data: {
    gymId: string;
    terminalId?: string;
    type: string;
    cardUid?: string;
    memberId?: string;
    actorUserId?: string;
    meta?: any;
  }) {
    return this.prisma.event.create({
      data,
    });
  }
}
