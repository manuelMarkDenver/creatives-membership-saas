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

  @Post('gyms/:gymId/pending-assignment/cancel')
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
