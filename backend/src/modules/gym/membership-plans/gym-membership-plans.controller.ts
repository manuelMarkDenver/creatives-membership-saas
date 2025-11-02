import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { GymMembershipPlansService } from './gym-membership-plans.service';
import {
  CreateGymMembershipPlanRequestDto,
  CreateGymMembershipPlanDto,
  UpdateGymMembershipPlanRequestDto,
  SoftDeleteGymMembershipPlanDto,
  RestoreGymMembershipPlanDto,
} from './dto/gym-membership-plan.dto';
import { AuthGuard } from '../../../core/auth/auth.guard';
import { RoleGuard } from '../../../core/auth/guards/role.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { GetUser } from '../../../core/auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import type { User } from '@prisma/client';

@Controller('gym/membership-plans')
@UseGuards(AuthGuard, RoleGuard)
export class GymMembershipPlansController {
  constructor(
    private readonly gymMembershipPlansService: GymMembershipPlansService,
  ) {}

  @Post()
  @Roles(Role.OWNER, Role.MANAGER)
  create(
    @Body() requestDto: CreateGymMembershipPlanRequestDto,
    @GetUser() user: User,
  ) {
    // Create internal DTO with tenantId from authenticated user
    const createDto: CreateGymMembershipPlanDto = {
      ...requestDto,
      tenantId: user.tenantId!,
    };
    return this.gymMembershipPlansService.createGymMembershipPlan(createDto);
  }

  @Get()
  @Roles(Role.OWNER, Role.MANAGER, Role.STAFF)
  findAllByTenant(
    @GetUser() user: User,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const includeDeletedBool = includeDeleted === 'true';
    return this.gymMembershipPlansService.findAllByTenant(
      user.tenantId!,
      includeDeletedBool,
    );
  }

  @Get('active')
  @Roles(Role.OWNER, Role.MANAGER, Role.STAFF)
  findActiveByTenant(@GetUser() user: User) {
    return this.gymMembershipPlansService.findAllActive(user.tenantId!);
  }

  @Get('stats')
  @Roles(Role.OWNER, Role.MANAGER)
  getStats(@GetUser() user: User) {
    return this.gymMembershipPlansService.getStats(user.tenantId!);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.MANAGER, Role.STAFF)
  findOne(
    @Param('id') id: string,
    @GetUser() user: User,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const includeDeletedBool = includeDeleted === 'true';
    return this.gymMembershipPlansService.findOne(
      id,
      user.tenantId!,
      includeDeletedBool,
    );
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateGymMembershipPlanRequestDto,
    @GetUser() user: User,
  ) {
    return this.gymMembershipPlansService.update(id, user.tenantId!, updateDto);
  }

  @Patch(':id/toggle-status')
  @Roles(Role.OWNER, Role.MANAGER)
  toggleStatus(@Param('id') id: string, @GetUser() user: User) {
    return this.gymMembershipPlansService.toggleStatus(id, user.tenantId!);
  }

  @Post(':id/soft-delete')
  @Roles(Role.OWNER, Role.MANAGER)
  softDelete(
    @Param('id') id: string,
    @Body() deleteDto: SoftDeleteGymMembershipPlanDto,
    @GetUser() user: User,
  ) {
    return this.gymMembershipPlansService.softDelete(
      id,
      user.tenantId!,
      user.id,
      deleteDto,
    );
  }

  @Post(':id/restore')
  @Roles(Role.OWNER, Role.MANAGER)
  restore(
    @Param('id') id: string,
    @Body() restoreDto: RestoreGymMembershipPlanDto,
    @GetUser() user: User,
  ) {
    return this.gymMembershipPlansService.restore(
      id,
      user.tenantId!,
      user.id,
      restoreDto,
    );
  }

  // Legacy endpoint for compatibility - now soft deletes instead of hard delete
  @Delete(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  remove(@Param('id') id: string, @GetUser() user: User) {
    // Default soft delete with generic reason for legacy compatibility
    const deleteDto: SoftDeleteGymMembershipPlanDto = {
      reason: 'Deleted via legacy endpoint',
      notes:
        'Deleted using legacy DELETE endpoint - converted to soft delete for safety',
    };
    return this.gymMembershipPlansService.softDelete(
      id,
      user.tenantId!,
      user.id,
      deleteDto,
    );
  }

  // Hard delete - only for development/admin purposes
  @Delete(':id/hard-delete')
  @Roles(Role.OWNER) // Only owners can hard delete
  hardDelete(@Param('id') id: string, @GetUser() user: User) {
    return this.gymMembershipPlansService.hardDelete(id, user.tenantId!);
  }
}
