import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { MembersService } from './members.service';
import type { MemberActionRequest, MemberHistoryQuery } from './members.service';
import { AuthGuard } from '../../core/auth/auth.guard';
import { RBACGuard, RequiredRoles } from '../../core/guard/rbac.guard';
import { Role } from '@prisma/client';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { id: string; tenantId?: string; role: Role; email: string };
}

@Controller('members')
@UseGuards(AuthGuard, RBACGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post(':id/activate')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async activateMember(
    @Param('id') id: string,
    @Body() body: MemberActionRequest,
    @Req() req: AuthenticatedRequest
  ) {
    try {
      console.log('🔄 ACTIVATE endpoint called for member:', id, 'body:', body, 'user:', req.user?.id);
      const { reason, notes } = body || {};
      const performedBy = req.user?.id;

      if (!performedBy) {
        throw new Error('User not authenticated');
      }

      if (!reason || reason.trim() === '') {
        throw new Error('Reason is required and cannot be empty');
      }

      return await this.membersService.activateMember(id, { reason: reason.trim(), notes }, performedBy);
    } catch (error) {
      console.error('❌ Error in activateMember controller:', error);
      throw error;
    }
  }

  @Post(':id/cancel')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async cancelMember(
    @Param('id') id: string,
    @Body() body: MemberActionRequest,
    @Req() req: AuthenticatedRequest
  ) {
    console.log('🔄 CANCEL endpoint called for member:', id, 'body:', body, 'user:', req.user?.id);
    const { reason, notes } = body;
    const performedBy = req.user?.id;

    if (!performedBy) {
      throw new Error('User not authenticated');
    }

    if (!reason) {
      throw new Error('Reason is required');
    }

    return this.membersService.cancelMember(id, { reason, notes }, performedBy);
  }

  @Post(':id/restore')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async restoreMember(
    @Param('id') id: string,
    @Body() body: MemberActionRequest,
    @Req() req: AuthenticatedRequest
  ) {
    console.log('🔄 RESTORE endpoint called for member:', id, 'body:', body, 'user:', req.user?.id);
    const { reason, notes } = body;
    const performedBy = req.user?.id;

    if (!performedBy) {
      throw new Error('User not authenticated');
    }

    if (!reason) {
      throw new Error('Reason is required');
    }

    return this.membersService.restoreMember(id, { reason, notes }, performedBy);
  }

  @Post(':id/renew')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async renewMemberSubscription(
    @Param('id') id: string,
    @Body() body: { membershipPlanId: string },
    @Req() req: AuthenticatedRequest
  ) {
    console.log('🔄 RENEW endpoint called for member:', id, 'body:', body, 'user:', req.user?.id);
    const { membershipPlanId } = body;
    const performedBy = req.user?.id;

    if (!performedBy) {
      throw new Error('User not authenticated');
    }

    if (!membershipPlanId) {
      throw new Error('Membership plan ID is required');
    }

    return this.membersService.renewMemberSubscription(id, membershipPlanId, performedBy);
  }

  @Get(':id/status')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getMemberWithStatus(@Param('id') id: string) {
    return this.membersService.getMemberWithStatus(id);
  }

  @Get(':id/history')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getMemberHistory(
    @Param('id') id: string,
    @Query() query: MemberHistoryQuery
  ) {
    // Convert string numbers to integers
    if (query.page) query.page = parseInt(query.page.toString());
    if (query.limit) query.limit = parseInt(query.limit.toString());

    return this.membersService.getMemberHistory(id, query);
  }

  @Get('action-reasons')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  getActionReasons() {
    return this.membersService.getActionReasons();
  }
}
