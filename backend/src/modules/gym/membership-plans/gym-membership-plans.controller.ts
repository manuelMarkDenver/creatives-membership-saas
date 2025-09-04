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
  CreateMembershipPlanDto,
  UpdateMembershipPlanDto,
} from '../../membership-plans/dto/membership-plan.dto';
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
  create(@Body() createDto: CreateMembershipPlanDto, @GetUser() user: User) {
    // Ensure the plan is created for the user's tenant
    createDto.tenantId = user.tenantId!;
    return this.gymMembershipPlansService.createMembershipPlan(createDto);
  }

  @Get()
  @Roles(Role.OWNER, Role.MANAGER, Role.STAFF)
  findAllByTenant(@GetUser() user: User) {
    return this.gymMembershipPlansService.findAllByTenant(user.tenantId!);
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
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.gymMembershipPlansService.findOne(id, user.tenantId!);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMembershipPlanDto,
    @GetUser() user: User,
  ) {
    return this.gymMembershipPlansService.update(id, user.tenantId!, updateDto);
  }

  @Patch(':id/toggle-status')
  @Roles(Role.OWNER, Role.MANAGER)
  toggleStatus(@Param('id') id: string, @GetUser() user: User) {
    return this.gymMembershipPlansService.toggleStatus(id, user.tenantId!);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.gymMembershipPlansService.remove(id, user.tenantId!);
  }
}
