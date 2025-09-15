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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

@Controller('gym/users')
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
    @Query('limit') limit?: string,
  ) {
    if (tenantId) {
      const filters = {
        role: role as Role,
        search,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        requestingUserId: req.user?.id,
        requestingUserRole: req.user?.role,
      };
      return this.usersService.getUsersByTenant(tenantId, filters);
    }

    // Only SUPER_ADMIN should be able to call getAllUsers without tenantId
    if (req.user?.role !== 'SUPER_ADMIN') {
      throw new BadRequestException(
        'tenantId parameter is required for non-super-admin users',
      );
    }

    return this.usersService.getAllUsers();
  }

  // General user creation (business-agnostic)
  @Post()
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  @AllowedBusinessTypes(BusinessCategory.GYM)
  create(@Body() data: CreateUserDto) {
    return this.usersService.createUser(data);
  }

    @Get('tenant/:tenantId')
    @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER, Role.STAFF)
    @RequiredAccessLevel(AccessLevel.STAFF_ACCESS)
    @SkipBusinessTypeGuard()
    getByTenant(
      @Req() req: any,
      @Param('tenantId') tenantId: string,
      @Query('role') role?: string,
      @Query('search') search?: string,
      @Query('page') page?: string,
      @Query('limit') limit?: string,
    ) {
      const filters = {
        role: role as Role,
        search,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        requestingUserId: req.user?.id,
        requestingUserRole: req.user?.role,
      };
      return this.usersService.getUsersByTenant(tenantId, filters);
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

  // Soft delete user (business agnostic)
  @Post(':id/soft-delete')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  @AllowedBusinessTypes(BusinessCategory.GYM)
  softDelete(
    @Param('id') id: string,
    @Body() body: { reason: string; notes?: string },
    @Req() req: any,
  ) {
    const { reason, notes } = body;
    const deletedBy = req.user?.id;

    if (!deletedBy) {
      throw new BadRequestException('User not authenticated');
    }

    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Reason is required for member deletion');
    }

    return this.usersService.softDeleteUser(id, deletedBy, {
      reason: reason.trim(),
      notes,
    });
  }

  // Restore soft-deleted user (business agnostic)
  @Post(':id/restore')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  @AllowedBusinessTypes(BusinessCategory.GYM)
  restoreUser(
    @Param('id') id: string,
    @Body() body: { reason: string; notes?: string },
    @Req() req: any,
  ) {
    const { reason, notes } = body;
    const performedBy = req.user?.id;

    if (!performedBy) {
      throw new BadRequestException('User not authenticated');
    }

    if (!reason || reason.trim() === '') {
      throw new BadRequestException(
        'Reason is required for member restoration',
      );
    }

    return this.usersService.restoreUser(id, performedBy, {
      reason: reason.trim(),
      notes,
    });
  }











  // Photo upload endpoints (business agnostic - works for all user types)
  @Post(':id/photo')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  @AllowedBusinessTypes(BusinessCategory.GYM)
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1,
      },
      fileFilter: (req, file, callback) => {
        // Check if file is an image
        if (!file.mimetype.startsWith('image/')) {
          return callback(new Error('Only image files are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadUserPhoto(
    @Param('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Photo file is required');
    }

    return this.usersService.uploadUserPhoto(userId, file);
  }

  @Delete(':id/photo')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  @AllowedBusinessTypes(BusinessCategory.GYM)
  async deleteUserPhoto(@Param('id') userId: string, @Req() req: any) {
    return this.usersService.deleteUserPhoto(userId);
  }
}
