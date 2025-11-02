import {
  Controller,
  Put,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { User } from '@prisma/client';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('tenants')
export class OwnerTenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Put('current')
  @UseGuards(AuthGuard)
  async updateCurrentTenant(
    @GetUser() user: User,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    // Only allow owners to update their own tenant
    if (user.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can update tenant details');
    }
    if (!user.tenantId) {
      throw new ForbiddenException('User has no tenant');
    }
    return this.tenantsService.updateTenant(user.tenantId, updateTenantDto);
  }
}
