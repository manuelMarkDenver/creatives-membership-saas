import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GymAnalyticsService } from './gym-analytics.service';
import { AuthGuard } from '../../../core/auth/auth.guard';
import { GetUser } from '../../../core/auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Controller('gym/analytics')
@UseGuards(AuthGuard)
export class GymAnalyticsController {
  constructor(private readonly analyticsService: GymAnalyticsService) {}

  @Get('revenue-metrics')
  async getRevenueMetrics(@GetUser() user: User, @Query() query: AnalyticsQueryDto) {
    if (!user.tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.analyticsService.getRevenueMetrics(user.tenantId, query);
  }

  @Get('branch-performance')
  async getBranchPerformance(@GetUser() user: User, @Query() query: AnalyticsQueryDto) {
    if (!user.tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.analyticsService.getBranchPerformance(user.tenantId, query);
  }

  @Get('member-growth')
  async getMemberGrowthStats(@GetUser() user: User, @Query() query: AnalyticsQueryDto) {
    if (!user.tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.analyticsService.getMemberGrowthStats(user.tenantId, query);
  }

  @Get('owner-insights')
  async getOwnerInsights(@GetUser() user: User, @Query() query: AnalyticsQueryDto) {
    if (!user.tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.analyticsService.getOwnerInsights(user.tenantId, query);
  }
}
