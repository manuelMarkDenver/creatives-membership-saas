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

    // Helper function to adjust date for filtering (handle date-only filtering)
    const adjustDateForFiltering = (date: Date, isStartDate: boolean): Date => {
      // Parse the ISO string to get the date components
      const isoString = date.toISOString();
      const [datePart] = isoString.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      
      if (isStartDate) {
        // Start of day in UTC: YYYY-MM-DDT00:00:00.000Z
        return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      } else {
        // End of day in UTC: YYYY-MM-DDT23:59:59.999Z
        return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
      }
    };

    const where: Prisma.DailyEntryWhereInput = {
      gymId: { in: gymIds },
      ...(startDate && { createdAt: { gte: adjustDateForFiltering(startDate, true) } }),
      ...(endDate && { createdAt: { lte: adjustDateForFiltering(endDate, false) } }),
      ...(status && { status }),
    };

    console.log(`🔍 DailyRepository.findMany query:`, {
      gymIds,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      status,
      where: JSON.stringify(where, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      }),
    });

    const [entries, total] = await Promise.all([
      this.prisma.dailyEntry.findMany({
        where,
        include: {
          gym: true,
          terminal: true,
        },
        orderBy: { createdAt: 'desc' },
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

    // Helper function to adjust date for filtering (handle date-only filtering)
    const adjustDateForFiltering = (date: Date, isStartDate: boolean): Date => {
      // Clone the date to avoid mutation
      const adjusted = new Date(date);
      
      if (isStartDate) {
        // For start date, set to beginning of day (00:00:00.000)
        adjusted.setUTCHours(0, 0, 0, 0);
      } else {
        // For end date, set to end of day (23:59:59.999)
        adjusted.setUTCHours(23, 59, 59, 999);
      }
      
      return adjusted;
    };

    const where: Prisma.DailyEntryWhereInput = {
      gymId: { in: gymIds },
      ...(startDate && { createdAt: { gte: adjustDateForFiltering(startDate, true) } }),
      ...(endDate && { createdAt: { lte: adjustDateForFiltering(endDate, false) } }),
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
