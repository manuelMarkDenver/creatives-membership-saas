import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { DailyService } from './daily.service';
import {
  GetDailyEntriesDto,
  VoidEntryDto,
  UnvoidEntryDto,
  DailyEntriesResponseDto,
} from './dto/daily.dto';
import { AuthGuard } from '../../core/auth/auth.guard';
import { GetUser } from '../../core/auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RBACGuard } from '../../core/guard/rbac.guard';
import { PrismaService } from '../../core/prisma/prisma.service';

@Controller('admin/daily-entries')
@UseGuards(AuthGuard, RBACGuard)
export class DailyController {
  constructor(
    private dailyService: DailyService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @Roles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getEntries(
    @Query() query: GetDailyEntriesDto,
    @GetUser() user: User,
  ): Promise<DailyEntriesResponseDto> {
    const { tenantId, id: userId, role } = user;
    if (!tenantId) {
      throw new Error('User must be associated with a tenant');
    }

    console.log(`🔍 DailyController: User ${userId} (${role}), tenant ${tenantId}`);
    
    // Get user's accessible branches
    const userBranches = await this.prisma.gymUserBranch.findMany({
      where: { userId },
      select: { branchId: true },
    });

    const accessibleBranchIds = userBranches.map(ub => ub.branchId);
    console.log(`🔍 User has ${accessibleBranchIds.length} GymUserBranch records:`, accessibleBranchIds);

    // Determine which branches user can access
    let allBranchIds: string[];
    
    // OWNER role should see ALL branches of their tenant
    if (role === 'OWNER') {
      const allTenantBranches = await this.prisma.branch.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, name: true },
      });
      console.log(`🔍 OWNER: Showing all ${allTenantBranches.length} tenant branches`);
      allBranchIds = allTenantBranches.map(b => b.id);
    } 
    // MANAGER/STAFF with GymUserBranch records
    else if (accessibleBranchIds.length > 0) {
      console.log(`🔍 MANAGER/STAFF: Showing ${accessibleBranchIds.length} assigned branches`);
      allBranchIds = accessibleBranchIds;
    }
    // Users without specific branch assignments (fallback)
    else {
      const allTenantBranches = await this.prisma.branch.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, name: true },
      });
      console.log(`🔍 No branch assignments: Showing all ${allTenantBranches.length} tenant branches`);
      allBranchIds = allTenantBranches.map(b => b.id);
    }

    // If branchId is specified in query, validate it's accessible to user
    let gymIds: string[];
    if (query.branchId && query.branchId !== 'all') {
      // Check if requested branch is accessible to user
      if (!allBranchIds.includes(query.branchId)) {
        throw new Error('Access denied to requested branch');
      }
      gymIds = [query.branchId];
    } else {
      gymIds = allBranchIds;
    }

    console.log(`🔍 Final gymIds to query:`, gymIds);

    // DEBUG: Check all DailyEntry records for this tenant
    const allDailyEntries = await this.prisma.dailyEntry.findMany({
      where: {
        gym: {
          tenantId: tenantId,
        },
      },
      select: {
        id: true,
        gymId: true,
        cardUid: true,
        amount: true,
        occurredAt: true,
      },
      take: 10,
    });
    console.log(`🔍 DEBUG: Found ${allDailyEntries.length} DailyEntry records for tenant ${tenantId}:`, allDailyEntries);

    if (gymIds.length === 0) {
      console.log(`⚠️ No gymIds found for user ${userId}. Returning empty response.`);
      // Return empty response if no branches found
      return {
        entries: [],
        summary: {
          recordedCount: 0,
          recordedAmountTotal: 0,
          voidedCount: 0,
          voidedAmountTotal: 0,
        },
        pagination: {
          page: query.page || 1,
          limit: query.limit || 20,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    console.log(`🔍 Querying DailyService with:`, {
      gymIds,
      startDate,
      endDate,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });

    const result = await this.dailyService.getEntries({
      gymIds,
      startDate,
      endDate,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });

    console.log(`🔍 DailyService returned ${result.entries.length} entries`);
    return result;
  }

  @Post(':id/void')
  @Roles(Role.OWNER, Role.MANAGER)
  async voidEntry(
    @Param('id') id: string,
    @Body() body: VoidEntryDto,
    @GetUser() user: User,
  ) {
    return this.dailyService.voidEntry(id, user.id, body.reason);
  }

  @Post(':id/unvoid')
  @Roles(Role.OWNER, Role.MANAGER)
  async unvoidEntry(
    @Param('id') id: string,
    @Body() body: UnvoidEntryDto,
    @GetUser() user: User,
  ) {
    return this.dailyService.unvoidEntry(id, user.id, body.reason);
  }
}