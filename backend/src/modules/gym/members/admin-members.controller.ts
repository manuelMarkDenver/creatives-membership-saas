import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { GymMembersService } from './gym-members.service';
import { AuthGuard } from '../../../core/auth/auth.guard';
import { RBACGuard, RequiredRoles } from '../../../core/guard/rbac.guard';
import { Role } from '@prisma/client';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    tenantId?: string;
    role: Role;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  headers: Request['headers'];
}

@Controller('admin/members')
@UseGuards(AuthGuard, RBACGuard)
export class AdminMembersController {
  constructor(private readonly gymMembersService: GymMembersService) {}

  @Post(':memberId/assign-card')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async assignCardToMember(
    @Param('memberId') memberId: string,
    @Body() body: { purpose?: 'ONBOARD' | 'REPLACE' },
    @Req() req: RequestWithUser,
  ) {
    const purpose = body.purpose || 'ONBOARD';
    const performedBy = req.user?.id;

    if (!performedBy) {
      throw new Error('User not authenticated');
    }

    return this.gymMembersService.assignCardToMember(
      memberId,
      purpose,
      performedBy,
    );
  }

  @Get('gyms/:gymId/pending-assignment')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getPendingAssignment(@Param('gymId') gymId: string) {
    const pending = await this.gymMembersService.getPendingAssignment(gymId);
    if (!pending) return null;

    return {
      memberId: pending.memberId,
      memberName: `${pending.member.firstName} ${pending.member.lastName}`,
      purpose: pending.purpose,
      expiresAt: pending.expiresAt,
    };
  }

  @Post(':memberId/disable-card')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async disableCard(
    @Param('memberId') memberId: string,
    @Body() body: { reason?: string },
    @Req() req: RequestWithUser,
  ) {
    const performedBy = req.user?.id;
    if (!performedBy) {
      throw new Error('User not authenticated');
    }

    return this.gymMembersService.disableCard(memberId, body, performedBy);
  }

  @Post(':memberId/renew')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async renewMembership(
    @Param('memberId') memberId: string,
    @Body() body: { planId: string },
    @Req() req: RequestWithUser,
  ) {
    const performedBy = req.user?.id;
    if (!performedBy) {
      throw new Error('User not authenticated');
    }

    return this.gymMembersService.renewMemberSubscription(
      memberId,
      body.planId,
      performedBy,
    );
  }

  @Post(':memberId/cancel')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async cancelMembership(
    @Param('memberId') memberId: string,
    @Body() body: { reason: string; notes?: string },
    @Req() req: RequestWithUser,
  ) {
    const performedBy = req.user?.id;
    if (!performedBy) {
      throw new Error('User not authenticated');
    }

    return this.gymMembersService.cancelMember(memberId, body, performedBy);
  }

  @Post(':memberId/enable-card')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async enableCard(
    @Param('memberId') memberId: string,
    @Body() body: { cardUid: string; reason?: string },
    @Req() req: RequestWithUser,
  ) {
    const performedBy = req.user?.id;
    if (!performedBy) {
      throw new Error('User not authenticated');
    }

    return this.gymMembersService.enableCard(memberId, body, performedBy);
  }

  @Post('gyms/:gymId/cancel-pending-assignment')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async cancelPendingAssignment(
    @Param('gymId') gymId: string,
    @Req() req: RequestWithUser,
  ) {
    const performedBy = req.user?.id;
    if (!performedBy) {
      throw new Error('User not authenticated');
    }

    await this.gymMembersService.cancelPendingAssignment(gymId, performedBy);
    return { ok: true };
  }
}
