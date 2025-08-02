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
        limit: limit ? parseInt(limit, 10) : undefined
      };
      return this.usersService.getUsersByTenant(tenantId, filters);
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
      limit: limit ? parseInt(limit, 10) : undefined
    };
    return this.usersService.getUsersByTenant(tenantId, filters);
  }

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

  // Gym-specific routes for expiring memberships
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
}
