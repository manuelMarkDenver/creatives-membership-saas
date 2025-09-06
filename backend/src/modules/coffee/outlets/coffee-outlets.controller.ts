import {
  Controller,
  Post,
  Body,
  Param,
  Put,
  Get,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BranchesService } from '../../branches/branches.service';
import {
  CreateBranchDto,
  UpdateBranchDto,
  AssignUserToBranchDto,
  UpdateUserBranchAccessDto,
} from '../../branches/dto/branch.dto';
import {
  RBACGuard,
  RequiredRoles,
  RequiredAccessLevel,
  AuthenticatedUser,
} from '../../../core/guard/rbac.guard';
import { AuthGuard } from '../../../core/auth/auth.guard';
import { Role, AccessLevel } from '@prisma/client';

@Controller('coffee/outlets')
@UseGuards(AuthGuard, RBACGuard)
export class CoffeeOutletsController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @RequiredRoles(Role.OWNER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async createCoffeeOutlet(
    @Body() createOutletDto: CreateBranchDto,
    @Request() req: any,
  ) {
    const user = req.user as AuthenticatedUser;
    // Handle bypass auth case - use tenantId from body or headers
    const tenantId =
      user?.tenantId || createOutletDto.tenantId || req.headers['x-tenant-id'];

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return this.branchesService.createBranch({
      ...createOutletDto,
      tenantId,
    });
  }

  @Put(':outletId')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async updateCoffeeOutlet(
    @Param('outletId') outletId: string,
    @Body() updateOutletDto: UpdateBranchDto,
  ) {
    return this.branchesService.updateBranch(outletId, updateOutletDto);
  }

  @Get()
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  @RequiredAccessLevel(AccessLevel.STAFF_ACCESS)
  async findAllCoffeeOutlets(@Request() req: any) {
    const user = req.user as AuthenticatedUser;
    // Handle bypass auth case - use tenantId from query or headers
    const tenantId =
      user?.tenantId || req.query?.tenantId || req.headers['x-tenant-id'];

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return this.branchesService.findAllBranches(tenantId);
  }

  @Get(':outletId')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  @RequiredAccessLevel(AccessLevel.STAFF_ACCESS)
  async findCoffeeOutletById(@Param('outletId') outletId: string) {
    return this.branchesService.findBranchById(outletId);
  }

  @Delete(':outletId')
  @RequiredRoles(Role.OWNER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async deleteCoffeeOutlet(@Param('outletId') outletId: string) {
    return this.branchesService.deleteBranch(outletId);
  }

  @Post(':outletId/staff')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async assignStaffToOutlet(
    @Param('outletId') outletId: string,
    @Body() assignUserDto: AssignUserToBranchDto,
  ) {
    return this.branchesService.assignUserToBranch(assignUserDto, outletId);
  }

  @Put(':outletId/staff/:userId')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async updateStaffOutletAccess(
    @Param('outletId') outletId: string,
    @Param('userId') userId: string,
    @Body() updateAccessDto: UpdateUserBranchAccessDto,
  ) {
    return this.branchesService.updateUserBranchAccess(
      updateAccessDto,
      userId,
      outletId,
    );
  }
}
