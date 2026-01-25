import { Injectable, NotFoundException } from '@nestjs/common';
import { DailyRepository } from './repositories/daily.repository';
import { EventsService } from '../access/events.service';

@Injectable()
export class DailyService {
  constructor(
    private dailyRepository: DailyRepository,
    private eventsService: EventsService,
  ) {}

  async getEntries(params: {
    gymIds: string[];
    startDate?: Date;
    endDate?: Date;
    status?: 'RECORDED' | 'VOIDED';
    page?: number;
    limit?: number;
  }) {
    const { gymIds, startDate, endDate, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    const { entries, total } = await this.dailyRepository.findMany({
      gymIds,
      startDate,
      endDate,
      status,
      skip,
      take,
    });

    const summary = await this.dailyRepository.getSummary({
      gymIds,
      startDate,
      endDate,
    });

    return {
      entries,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async voidEntry(id: string, userId: string, reason?: string) {
    const entry = await this.dailyRepository.findById(id);
    
    if (!entry) {
      throw new NotFoundException('Daily entry not found');
    }

    if (entry.status === 'VOIDED') {
      throw new Error('Entry is already voided');
    }

    const updatedEntry = await this.dailyRepository.update(id, {
      status: 'VOIDED',
      voidedAt: new Date(),
      voidedByUserId: userId,
      voidReason: reason,
    });

    await this.eventsService.logEvent({
      gymId: entry.gymId,
      type: 'DAILY_ENTRY_VOIDED',
      cardUid: entry.cardUid,
      actorUserId: userId,
      meta: {
        entryId: id,
        amount: entry.amount,
        reason,
      },
    });

    return updatedEntry;
  }

  async unvoidEntry(id: string, userId: string, reason?: string) {
    const entry = await this.dailyRepository.findById(id);
    
    if (!entry) {
      throw new NotFoundException('Daily entry not found');
    }

    if (entry.status === 'RECORDED') {
      throw new Error('Entry is already recorded');
    }

    const updatedEntry = await this.dailyRepository.update(id, {
      status: 'RECORDED',
      voidedAt: null,
      voidedByUserId: null,
      voidReason: null,
    });

    await this.eventsService.logEvent({
      gymId: entry.gymId,
      type: 'DAILY_ENTRY_UNVOIDED',
      cardUid: entry.cardUid,
      actorUserId: userId,
      meta: {
        entryId: id,
        amount: entry.amount,
        reason,
      },
    });

    return updatedEntry;
  }

  async getSummary(params: {
    gymIds: string[];
    startDate?: Date;
    endDate?: Date;
  }) {
    return this.dailyRepository.getSummary(params);
  }
}