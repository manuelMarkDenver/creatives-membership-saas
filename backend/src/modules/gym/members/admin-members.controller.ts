import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  Delete,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { GymMembersService } from './gym-members.service';
import { AuthGuard } from '../../../core/auth/auth.guard';
import { RBACGuard, RequiredRoles } from '../../../core/guard/rbac.guard';
import { Role } from '@prisma/client';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    tenantId?: string;
    role: Role;
    email: string;
    firstName?: string;
    lastName?: string;
    branchAccess?: { branchId: string }[];
  };
  headers: Request['headers'];
}

interface ImportGymMemberRowDto {
  externalMemberId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
}

interface ImportGymMembersDto {
  tenantId: string;
  branchId: string;
  members: ImportGymMemberRowDto[];
}

@Controller('admin/members')
@UseGuards(AuthGuard, RBACGuard)
export class AdminMembersController {
  constructor(private readonly gymMembersService: GymMembersService) {}

  @Post('import')
  @RequiredRoles(Role.SUPER_ADMIN)
  async importGymMembers(
    @Body() body: ImportGymMembersDto,
    @Req() req: RequestWithUser,
  ) {
    if (!req.user?.id) {
      throw new Error('User not authenticated');
    }

    if (!body?.tenantId || !body?.branchId) {
      throw new BadRequestException('tenantId and branchId are required');
    }

    if (!Array.isArray(body?.members) || body.members.length === 0) {
      throw new BadRequestException('members must be a non-empty array');
    }

    return this.gymMembersService.importGymMembersForSuperAdmin({
      tenantId: body.tenantId,
      branchId: body.branchId,
      members: body.members,
      performedBy: req.user.id,
    });
  }

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

  @Get('pending-assignment')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getPendingAssignmentData(
    @Query('gymId') gymId: string | undefined,
    @Req() req: RequestWithUser,
  ) {
    if (!req.user?.id) {
      throw new Error('User not authenticated');
    }

    const targetGymId = this.resolveGymId(req, gymId);
    this.ensureGymAccess(req, targetGymId);

    return this.gymMembersService.getPendingAssignmentForAdmin(targetGymId);
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

  @Post(':memberId/cancel')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async cancelMembership(
    @Param('memberId') memberId: string,
    @Body() body: { reason?: string; cardReturned?: boolean },
    @Req() req: RequestWithUser,
  ) {
    const performedBy = req.user?.id;
    if (!performedBy) {
      throw new Error('User not authenticated');
    }

    const member = await this.gymMembersService.getMemberById(memberId);
    const gymId = member.gymMemberProfile?.primaryBranchId;
    if (!gymId) {
      throw new BadRequestException('Member has no associated gym');
    }

    this.ensureGymAccess(req, gymId);

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

  @Post(':memberId/replace/start')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async replaceCard(
    @Param('memberId') memberId: string,
    @Req() req: RequestWithUser,
  ) {
    const performedBy = req.user?.id;
    if (!performedBy) {
      throw new Error('User not authenticated');
    }

    return this.gymMembersService.assignCardToMember(
      memberId,
      'REPLACE',
      performedBy,
    );
  }

  @Delete('pending-assignment')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async cancelPendingAssignment(
    @Query('gymId') gymId: string | undefined,
    @Req() req: RequestWithUser,
  ) {
    const performedBy = req.user?.id;
    if (!performedBy) {
      throw new Error('User not authenticated');
    }

    const targetGymId = this.resolveGymId(req, gymId);
    this.ensureGymAccess(req, targetGymId);

    await this.gymMembersService.cancelPendingAssignment(
      targetGymId,
      performedBy,
    );
    return { cancelled: true };
  }

  @Post('pending-assignment/restart')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async restartPendingReclaim(
    @Body() body: { memberId: string; gymId?: string },
    @Req() req: RequestWithUser,
  ) {
    const performedBy = req.user?.id;
    if (!performedBy) {
      throw new Error('User not authenticated');
    }

    if (!body?.memberId) {
      throw new BadRequestException('memberId is required');
    }

    const member = await this.gymMembersService.getMemberById(body.memberId);
    const memberGymId = member.gymMemberProfile?.primaryBranchId;
    if (!memberGymId) {
      throw new BadRequestException('Member has no associated gym');
    }

    const targetGymId = body.gymId ?? memberGymId;
    if (targetGymId !== memberGymId) {
      throw new BadRequestException('gymId does not match member gym');
    }

    this.ensureGymAccess(req, targetGymId);

    return this.gymMembersService.restartReclaimPending(
      targetGymId,
      body.memberId,
      performedBy,
    );
  }

  private resolveGymId(req: RequestWithUser, gymId?: string): string {
    if (gymId) return gymId;
    const branchAccess = req.user?.branchAccess;
    if (!branchAccess || branchAccess.length === 0) {
      throw new BadRequestException('gymId is required');
    }
    return branchAccess[0].branchId;
  }

  private ensureGymAccess(req: RequestWithUser, gymId: string) {
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role === Role.SUPER_ADMIN || user.role === Role.OWNER) {
      return;
    }

    if (!user.branchAccess?.some((branch) => branch.branchId === gymId)) {
      throw new ForbiddenException(
        'Insufficient branch access for this operation',
      );
    }
  }
}
