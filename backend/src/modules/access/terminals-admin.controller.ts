import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../core/auth/auth.guard';
import { RBACGuard, RequiredRoles } from '../../core/guard/rbac.guard';
import { Role } from '@prisma/client';
import { TerminalsService } from './terminals.service';

@Controller('admin/terminals')
@UseGuards(AuthGuard, RBACGuard)
export class TerminalsAdminController {
  constructor(private terminalsService: TerminalsService) {}

  @Get()
  @RequiredRoles(Role.SUPER_ADMIN)
  async list(
    @Query('tenantId') tenantId: string,
    @Query('branchId') branchId?: string,
  ) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    return this.terminalsService.listTerminals({ tenantId, branchId });
  }

  @Post()
  @RequiredRoles(Role.SUPER_ADMIN)
  async create(
    @Body() body: { tenantId: string; branchId: string; name: string },
  ) {
    return this.terminalsService.createTerminal({
      tenantId: body.tenantId,
      branchId: body.branchId,
      name: body.name,
    });
  }

  @Post(':terminalId/rotate-secret')
  @RequiredRoles(Role.SUPER_ADMIN)
  async rotateSecret(
    @Param('terminalId') terminalId: string,
    @Body() body: { tenantId: string },
  ) {
    return this.terminalsService.rotateTerminalSecret({
      tenantId: body.tenantId,
      terminalId,
    });
  }

  @Patch(':terminalId')
  @RequiredRoles(Role.SUPER_ADMIN)
  async update(
    @Param('terminalId') terminalId: string,
    @Body()
    body: {
      tenantId: string;
      name?: string;
      isActive?: boolean;
      branchId?: string;
    },
  ) {
    return this.terminalsService.updateTerminal({
      tenantId: body.tenantId,
      terminalId,
      name: body.name,
      isActive: body.isActive,
      branchId: body.branchId,
    });
  }
}
