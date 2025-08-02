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
}
