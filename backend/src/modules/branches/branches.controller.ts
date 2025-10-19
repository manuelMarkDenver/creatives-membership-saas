import {
  Controller,
  Post,
  Body,
  Param,
  Put,
  Get,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
// import { ApiTags } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import {
  CreateBranchDto,
  UpdateBranchDto,
  AssignUserToBranchDto,
  UpdateUserBranchAccessDto,
} from './dto/branch.dto';
import {
  RBACGuard,
  RequiredRoles,
  RequiredAccessLevel,
  AuthenticatedUser,
} from '../../core/guard/rbac.guard';
import { AuthGuard } from '../../core/auth/auth.guard';
import { Role, AccessLevel } from '@prisma/client';

// @ApiTags('Branches')
@Controller('branches')
@UseGuards(AuthGuard, RBACGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async createBranch(
    @Body() createBranchDto: CreateBranchDto,
    @Request() req: any,
  ) {
    const user = req.user as AuthenticatedUser;
    // Handle bypass auth case - use tenantId from body or headers
    const tenantId =
      user?.tenantId || createBranchDto.tenantId || req.headers['x-tenant-id'];

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return this.branchesService.createBranch({ ...createBranchDto, tenantId });
  }

  @Put(':branchId')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async updateBranch(
    @Param('branchId') branchId: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return this.branchesService.updateBranch(branchId, updateBranchDto);
  }

  @Get('system/all')
  @RequiredRoles(Role.SUPER_ADMIN)
  async findAllBranchesSystemWide(@Query('includeDeleted') includeDeleted?: string) {
    return this.branchesService.findAllBranchesSystemWide(includeDeleted === 'true');
  }

  @Get()
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  @RequiredAccessLevel(AccessLevel.STAFF_ACCESS)
  async findAllBranches(@Request() req: any, @Query('includeDeleted') includeDeleted?: string) {
    const user = req.user as AuthenticatedUser;
    // Handle bypass auth case - use tenantId from query or headers
    const tenantId =
      user?.tenantId || req.query?.tenantId || req.headers['x-tenant-id'];

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return this.branchesService.findAllBranches(tenantId, includeDeleted === 'true');
  }

  @Get(':branchId')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  @RequiredAccessLevel(AccessLevel.STAFF_ACCESS)
  async findBranchById(@Param('branchId') branchId: string) {
    return this.branchesService.findBranchById(branchId);
  }

  @Delete(':branchId')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async deleteBranch(@Param('branchId') branchId: string) {
    return this.branchesService.deleteBranch(branchId);
  }

  @Put(':branchId/restore')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async restoreBranch(@Param('branchId') branchId: string) {
    return this.branchesService.restoreBranch(branchId);
  }

  @Get(':branchId/users')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.STAFF_ACCESS)
  async getBranchUsers(@Param('branchId') branchId: string) {
    return this.branchesService.getBranchUsers(branchId);
  }

  @Post(':branchId/users/bulk-reassign')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async bulkReassignUsers(
    @Param('branchId') fromBranchId: string,
    @Body() data: { userIds: string[]; toBranchId: string; reason?: string }
  ) {
    return this.branchesService.bulkReassignUsers(fromBranchId, data.toBranchId, data.userIds, data.reason);
  }

  @Delete(':branchId/force')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async forceDeleteBranch(
    @Param('branchId') branchId: string,
    @Body() data: { reason: string; confirmationText: string },
    @Request() req: any
  ) {
    const user = req.user as AuthenticatedUser;
    return this.branchesService.forceDeleteBranch(branchId, data.reason, data.confirmationText, user.id);
  }

  @Post(':branchId/users')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async assignUserToBranch(
    @Param('branchId') branchId: string,
    @Body() assignUserToBranchDto: AssignUserToBranchDto,
  ) {
    return this.branchesService.assignUserToBranch(
      assignUserToBranchDto,
      branchId,
    );
  }

  @Put(':branchId/users/:userId')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async updateUserBranchAccess(
    @Param('branchId') branchId: string,
    @Param('userId') userId: string,
    @Body() updateUserBranchAccessDto: UpdateUserBranchAccessDto,
  ) {
    return this.branchesService.updateUserBranchAccess(
      updateUserBranchAccessDto,
      userId,
      branchId,
    );
  }
}
