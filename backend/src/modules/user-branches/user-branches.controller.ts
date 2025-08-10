import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { UserBranchesService } from './user-branches.service';
import { AuthGuard } from '../../core/auth/auth.guard';
import { RBACGuard, RequiredRoles, RequiredAccessLevel } from '../../core/guard/rbac.guard';
import { CreateUserBranchDto, UpdateUserBranchDto } from './dto/user-branch.dto';
import { Role, AccessLevel } from '@prisma/client';

@Controller('user-branches')
@UseGuards(AuthGuard, RBACGuard)
export class UserBranchesController {
  constructor(private readonly userBranchesService: UserBranchesService) {}

  /**
   * Get all user-branch assignments for a tenant
   * Only accessible by OWNER, MANAGER roles
   */
  @Get()
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  async getUserBranchAssignments(
    @Req() req: any,
    @Query('tenantId') tenantId?: string,
    @Query('branchId') branchId?: string,
    @Query('userId') userId?: string,
  ) {
    const currentUser = req.user;
    // Super admin can query any tenant
    if (currentUser.role === 'SUPER_ADMIN') {
      return this.userBranchesService.getUserBranchAssignments({
        tenantId,
        branchId,
        userId,
      });
    }

    // Others can only query their own tenant
    if (!currentUser.tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return this.userBranchesService.getUserBranchAssignments({
      tenantId: currentUser.tenantId,
      branchId,
      userId,
    });
  }

  /**
   * Get branch assignments for a specific user
   */
  @Get('user/:userId')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER, Role.STAFF)
  async getUserBranches(
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    const currentUser = req.user;
    // Staff can only view their own branch assignments
    if (currentUser.role === 'STAFF' && currentUser.id !== userId) {
      throw new ForbiddenException('Staff can only view their own branch assignments');
    }

    return this.userBranchesService.getUserBranches(userId, currentUser);
  }

  /**
   * Get users assigned to a specific branch
   */
  @Get('branch/:branchId')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  async getBranchUsers(
    @Param('branchId') branchId: string,
    @Req() req: any,
  ) {
    return this.userBranchesService.getBranchUsers(branchId, req.user);
  }

  /**
   * Assign user to branch(es)
   * Only OWNER can assign. MANAGER can assign STAFF to their accessible branches
   */
  @Post()
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  async assignUserToBranch(
    @Body() createUserBranchDto: CreateUserBranchDto,
    @Req() req: any,
  ) {
    return this.userBranchesService.assignUserToBranch(
      createUserBranchDto,
      req.user,
    );
  }

  /**
   * Update user-branch assignment
   */
  @Put(':id')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  async updateUserBranchAssignment(
    @Param('id') id: string,
    @Body() updateUserBranchDto: UpdateUserBranchDto,
    @Req() req: any,
  ) {
    return this.userBranchesService.updateUserBranchAssignment(
      id,
      updateUserBranchDto,
      req.user,
    );
  }

  /**
   * Remove user from branch
   */
  @Delete(':id')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  async removeUserFromBranch(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.userBranchesService.removeUserFromBranch(id, req.user);
  }

  /**
   * Bulk assign user to multiple branches
   */
  @Post('bulk-assign')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER)
  async bulkAssignUserToBranches(
    @Body() bulkAssignDto: {
      userId: string;
      branchIds: string[];
      accessLevel?: 'MANAGER_ACCESS' | 'STAFF_ACCESS';
      primaryBranchId?: string;
    },
    @Req() req: any,
  ) {
    return this.userBranchesService.bulkAssignUserToBranches(
      bulkAssignDto,
      req.user,
    );
  }
}
