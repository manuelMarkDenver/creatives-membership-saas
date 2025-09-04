import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { RBACGuard, RequiredRoles } from '../../core/guard/rbac.guard';
import { AuthGuard } from '../../core/auth/auth.guard';
import { Role } from '@prisma/client';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

@Controller('plans')
@UseGuards(AuthGuard, RBACGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  async getAllPlans() {
    return this.plansService.getAllPlans();
  }

  @Get('active')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  async getActivePlans() {
    return this.plansService.getActivePlans();
  }

  @Get(':id')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  async getPlanById(@Param('id') id: string) {
    return this.plansService.getPlanById(id);
  }

  @Post()
  @RequiredRoles(Role.SUPER_ADMIN)
  async createPlan(@Body() createPlanDto: CreatePlanDto) {
    return this.plansService.createPlan(createPlanDto);
  }

  @Put(':id')
  @RequiredRoles(Role.SUPER_ADMIN)
  async updatePlan(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return this.plansService.updatePlan(id, updatePlanDto);
  }

  @Delete(':id')
  @RequiredRoles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePlan(@Param('id') id: string) {
    return this.plansService.deletePlan(id);
  }

  @Put(':id/toggle-status')
  @RequiredRoles(Role.SUPER_ADMIN)
  async togglePlanStatus(@Param('id') id: string) {
    return this.plansService.togglePlanStatus(id);
  }

  @Get(':id/subscriptions')
  @RequiredRoles(Role.SUPER_ADMIN)
  async getPlanSubscriptions(@Param('id') id: string) {
    return this.plansService.getPlanSubscriptions(id);
  }
}
