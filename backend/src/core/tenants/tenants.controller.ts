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
  Patch,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantQueryDto } from './dto/tenant-query.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import {
  RBACGuard,
  RequiredRoles,
  RequiredAccessLevel,
} from '../guard/rbac.guard';
import { AuthGuard } from '../auth/auth.guard';
import { Role, AccessLevel } from '@prisma/client';

@Controller('tenants')
@UseGuards(AuthGuard, RBACGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('system/stats')
  @RequiredRoles(Role.SUPER_ADMIN)
  async getSystemStats() {
    return this.tenantsService.getSystemStats();
  }

  @Get()
  @RequiredRoles(Role.SUPER_ADMIN)
  async findAll(@Query() query: TenantQueryDto) {
    return this.tenantsService.listTenants(query.category);
  }

  @Get(':id')
  @RequiredRoles(Role.SUPER_ADMIN)
  async getTenant(@Param('id') id: string) {
    return this.tenantsService.getTenant(id);
  }

  @Post()
  @RequiredRoles(Role.SUPER_ADMIN)
  async create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.createTenant(createTenantDto);
  }

  @Put(':id')
  @RequiredRoles(Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantsService.updateTenant(id, updateTenantDto);
  }

  @Delete(':id')
  @RequiredRoles(Role.SUPER_ADMIN)
  async delete(@Param('id') id: string) {
    return this.tenantsService.deleteTenant(id);
  }

  @Patch(':id/free-branch-override')
  @RequiredRoles(Role.SUPER_ADMIN)
  async updateFreeBranchOverride(
    @Param('id') id: string,
    @Body() body: { override: number },
  ) {
    return this.tenantsService.updateFreeBranchOverride(id, body.override);
  }

  @Get(':id/owner')
  @RequiredRoles(Role.SUPER_ADMIN)
  async getTenantOwner(@Param('id') id: string) {
    return this.tenantsService.getTenantOwner(id);
  }

  @Put(':id/owner')
  @RequiredRoles(Role.SUPER_ADMIN)
  async updateTenantOwner(
    @Param('id') id: string,
    @Body() ownerData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phoneNumber?: string;
    },
  ) {
    return this.tenantsService.updateTenantOwner(id, ownerData);
  }

  @Post(':id/owner/reset-password')
  @RequiredRoles(Role.SUPER_ADMIN)
  async resetTenantOwnerPassword(@Param('id') id: string) {
    return this.tenantsService.resetTenantOwnerPassword(id);
  }

  // Onboarding endpoints - accessible by owners for their own tenant
  @Get(':id/onboarding-status')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  async getOnboardingStatus(@Param('id') id: string) {
    return this.tenantsService.getTenantOnboardingStatus(id);
  }

  @Post(':id/complete-onboarding')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER)
  async completeOnboarding(@Param('id') id: string) {
    return this.tenantsService.markOnboardingComplete(id);
  }

  @Post(':id/mark-password-changed')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER)
  async markPasswordChanged(@Param('id') id: string) {
    return this.tenantsService.markOwnerPasswordChanged(id);
  }
}
