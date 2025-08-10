import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  BusinessTypeGuard,
  AllowedBusinessTypes,
  SkipBusinessTypeGuard,
} from '../guard/business-type.guard';
import {
  RBACGuard,
  RequiredRoles,
  RequiredAccessLevel,
  SkipRBAC,
} from '../guard/rbac.guard';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BusinessCategory, Role, AccessLevel } from '@prisma/client';

@Controller('users')
@UseGuards(AuthGuard, RBACGuard, BusinessTypeGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Admin route - GET /users (no tenant restriction)
  @Get()
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER)
  @SkipBusinessTypeGuard()
  findAll(
    @Req() req: any,
    @Query('tenantId') tenantId?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    if (tenantId) {
      const filters = {
        role: role as Role,
        search,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        requestingUserId: req.user?.id,
        requestingUserRole: req.user?.role
      };
      return this.usersService.getUsersByTenant(tenantId, filters);
    }
    
    // Only SUPER_ADMIN should be able to call getAllUsers without tenantId
    if (req.user?.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('tenantId parameter is required for non-super-admin users');
    }
    
    return this.usersService.getAllUsers();
  }

  // Tenant-scoped routes with business type validation
  @Post()
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  @AllowedBusinessTypes(BusinessCategory.GYM)
  create(@Body() data: CreateUserDto) {
    return this.usersService.createUser(data);
  }

  @Get('tenant/:tenantId')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  @RequiredAccessLevel(AccessLevel.STAFF_ACCESS)
  @AllowedBusinessTypes(BusinessCategory.GYM)
  getByTenant(
    @Req() req: any,
    @Param('tenantId') tenantId: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const filters = {
      role: role as Role,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      requestingUserId: req.user?.id,
      requestingUserRole: req.user?.role
    };
    return this.usersService.getUsersByTenant(tenantId, filters);
  }

  // Gym-specific routes for expiring memberships - MUST be before parameterized routes
  @Get('expiring/:tenantId')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  @RequiredAccessLevel(AccessLevel.STAFF_ACCESS)
  @AllowedBusinessTypes(BusinessCategory.GYM)
  async getExpiringGymMembers(
    @Param('tenantId') tenantId: string,
    @Query('daysBefore') daysBefore?: string,
  ) {
    const days = parseInt(daysBefore || '30', 10);
    return this.usersService.getExpiringGymMembers(tenantId, days);
  }

  @Get('expiring/:tenantId/notifications')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  @RequiredAccessLevel(AccessLevel.STAFF_ACCESS)
  @AllowedBusinessTypes(BusinessCategory.GYM)
  async getExpiringGymMembersWithNotifications(
    @Param('tenantId') tenantId: string,
    @Query('daysBefore') daysBefore?: string,
  ) {
    const days = parseInt(daysBefore || '30', 10);
    return this.usersService.getExpiringGymMembersWithNotifications(tenantId, days);
  }

  // Get expiring members count for current user's context
  @Get('expiring-count/:tenantId')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  @RequiredAccessLevel(AccessLevel.STAFF_ACCESS)
  @AllowedBusinessTypes(BusinessCategory.GYM)
  async getExpiringMembersCount(
    @Param('tenantId') tenantId: string,
    @Query('daysBefore') daysBefore?: string,
  ) {
    const days = parseInt(daysBefore || '7', 10);
    return this.usersService.getExpiringMembersCount(tenantId, days);
  }

  // Super Admin + role-based expiring members overview
  @Get('expiring-overview')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER, Role.STAFF)
  @RequiredAccessLevel(AccessLevel.STAFF_ACCESS)
  @SkipBusinessTypeGuard() // Super Admin can access all
  async getExpiringMembersOverview(
    @Req() req: any,
    @Query('daysBefore') daysBefore?: string,
    @Query('tenantId') tenantId?: string,
    @Query('branchId') branchId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const days = parseInt(daysBefore || '7', 10);
    const filters = {
      userId: req.user?.id, // Pass user ID for branch access validation
      tenantId,
      branchId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      userRole: req.user?.role,
      userTenantId: req.user?.tenantId
    };
    
    return await this.usersService.getExpiringMembersOverview(days, filters);
  }

  // Parameterized routes - MUST be after specific routes to avoid conflicts
  @Get(':id')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  @RequiredAccessLevel(AccessLevel.STAFF_ACCESS)
  @AllowedBusinessTypes(BusinessCategory.GYM)
  getOne(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @Patch(':id')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  @AllowedBusinessTypes(BusinessCategory.GYM)
  update(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.usersService.updateUser(id, data);
  }

  @Delete(':id')
  @RequiredRoles(Role.OWNER)
  @RequiredAccessLevel(AccessLevel.FULL_ACCESS)
  @AllowedBusinessTypes(BusinessCategory.GYM)
  remove(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
