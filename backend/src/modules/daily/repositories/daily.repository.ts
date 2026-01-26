import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DailyRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.DailyEntryCreateInput) {
    return this.prisma.dailyEntry.create({ data });
  }

  async findById(id: string) {
    return this.prisma.dailyEntry.findUnique({
      where: { id },
      include: {
        gym: true,
        terminal: true,
      },
    });
  }

  async update(id: string, data: Prisma.DailyEntryUpdateInput) {
    return this.prisma.dailyEntry.update({
      where: { id },
      data,
    });
  }

  async findMany(params: {
    gymIds: string[];
    startDate?: Date;
    endDate?: Date;
    status?: 'RECORDED' | 'VOIDED';
    skip?: number;
    take?: number;
  }) {
    const { gymIds, startDate, endDate, status, skip, take } = params;

    const where: Prisma.DailyEntryWhereInput = {
      gymId: { in: gymIds },
      ...(startDate && { occurredAt: { gte: startDate } }),
      ...(endDate && { occurredAt: { lte: endDate } }),
      ...(status && { status }),
    };

    console.log(`🔍 DailyRepository.findMany query:`, {
      gymIds,
      startDate,
      endDate,
      status,
      where: JSON.stringify(where),
    });

    const [entries, total] = await Promise.all([
      this.prisma.dailyEntry.findMany({
        where,
        include: {
          gym: true,
          terminal: true,
        },
        orderBy: { occurredAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.dailyEntry.count({ where }),
    ]);

    console.log(
      `🔍 DailyRepository.findMany result: ${entries.length} entries, ${total} total`,
    );

    return { entries, total };
  }

  async getSummary(params: {
    gymIds: string[];
    startDate?: Date;
    endDate?: Date;
  }) {
    const { gymIds, startDate, endDate } = params;

    const where: Prisma.DailyEntryWhereInput = {
      gymId: { in: gymIds },
      ...(startDate && { occurredAt: { gte: startDate } }),
      ...(endDate && { occurredAt: { lte: endDate } }),
    };

    const [recordedEntries, voidedEntries] = await Promise.all([
      this.prisma.dailyEntry.findMany({
        where: { ...where, status: 'RECORDED' },
        select: { amount: true },
      }),
      this.prisma.dailyEntry.findMany({
        where: { ...where, status: 'VOIDED' },
        select: { amount: true },
      }),
    ]);

    const recordedCount = recordedEntries.length;
    const recordedAmountTotal = recordedEntries.reduce(
      (sum, entry) => sum + entry.amount,
      0,
    );
    const voidedCount = voidedEntries.length;
    const voidedAmountTotal = voidedEntries.reduce(
      (sum, entry) => sum + entry.amount,
      0,
    );

    return {
      recordedCount,
      recordedAmountTotal,
      voidedCount,
      voidedAmountTotal,
    };
  }
}
