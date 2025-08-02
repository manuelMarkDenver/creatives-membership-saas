import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { MembershipPlansService } from './membership-plans.service';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './dto/membership-plan.dto';
import { AuthGuard } from '../../core/auth/auth.guard';
import { RoleGuard } from '../../core/auth/guards/role.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { GetUser } from '../../core/auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import type { User } from '@prisma/client';

@Controller('membership-plans')
@UseGuards(AuthGuard, RoleGuard)
export class MembershipPlansController {
  constructor(private readonly membershipPlansService: MembershipPlansService) {}

  @Post()
  @Roles(Role.OWNER, Role.MANAGER)
  create(@Body() createDto: CreateMembershipPlanDto, @GetUser() user: User) {
    // Ensure the plan is created for the user's tenant
    createDto.tenantId = user.tenantId!;
    return this.membershipPlansService.createMembershipPlan(createDto);
  }

  @Get()
  @Roles(Role.OWNER, Role.MANAGER, Role.STAFF)
  findAllByTenant(@GetUser() user: User) {
    return this.membershipPlansService.findAllByTenant(user.tenantId!);
  }

  @Get('active')
  @Roles(Role.OWNER, Role.MANAGER, Role.STAFF)
  findActiveByTenant(@GetUser() user: User) {
    return this.membershipPlansService.findAllActive(user.tenantId!);
  }

  @Get('system/all')
  @Roles(Role.SUPER_ADMIN)
  findAllPlansForSuperAdmin() {
    return this.membershipPlansService.findAllPlansForSuperAdmin();
  }

  @Get('stats')
  @Roles(Role.OWNER, Role.MANAGER)
  getStats(@GetUser() user: User) {
    return this.membershipPlansService.getStats(user.tenantId!);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.MANAGER, Role.STAFF)
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.membershipPlansService.findOne(id, user.tenantId!);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  update(@Param('id') id: string, @Body() updateDto: UpdateMembershipPlanDto, @GetUser() user: User) {
    return this.membershipPlansService.update(id, user.tenantId!, updateDto);
  }

  @Patch(':id/toggle-status')
  @Roles(Role.OWNER, Role.MANAGER)
  toggleStatus(@Param('id') id: string, @GetUser() user: User) {
    return this.membershipPlansService.toggleStatus(id, user.tenantId!);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.membershipPlansService.remove(id, user.tenantId!);
  }
}
