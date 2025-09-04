import {
  Controller,
  Post,
  Body,
  Param,
  Put,
  Get,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GymLocationsService } from './gym-locations.service';
import {
  CreateBranchDto,
  UpdateBranchDto,
  AssignUserToBranchDto,
  UpdateUserBranchAccessDto,
} from '../../branches/dto/branch.dto';
import {
  RBACGuard,
  RequiredRoles,
  RequiredAccessLevel,
  AuthenticatedUser,
} from '../../../core/guard/rbac.guard';
import { AuthGuard } from '../../../core/auth/auth.guard';
import { Role, AccessLevel } from '@prisma/client';

@Controller('gym/locations')
@UseGuards(AuthGuard, RBACGuard)
export class GymLocationsController {
  constructor(private readonly gymLocationsService: GymLocationsService) {}

  @Post()
  @RequiredRoles(Role.OWNER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async createGymLocation(
    @Body() createLocationDto: CreateBranchDto,
    @Request() req: any,
  ) {
    const user = req.user as AuthenticatedUser;
    // Handle bypass auth case - use tenantId from body or headers
    const tenantId =
      user?.tenantId ||
      createLocationDto.tenantId ||
      req.headers['x-tenant-id'];

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return this.gymLocationsService.createGymLocation({
      ...createLocationDto,
      tenantId,
    });
  }

  @Put(':locationId')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async updateGymLocation(
    @Param('locationId') locationId: string,
    @Body() updateLocationDto: UpdateBranchDto,
  ) {
    return this.gymLocationsService.updateGymLocation(
      locationId,
      updateLocationDto,
    );
  }

  @Get()
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  @RequiredAccessLevel(AccessLevel.STAFF_ACCESS)
  async findAllGymLocations(@Request() req: any) {
    const user = req.user as AuthenticatedUser;
    // Handle bypass auth case - use tenantId from query or headers
    const tenantId =
      user?.tenantId || req.query?.tenantId || req.headers['x-tenant-id'];

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return this.gymLocationsService.findAllGymLocations(tenantId);
  }

  @Get(':locationId')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  @RequiredAccessLevel(AccessLevel.STAFF_ACCESS)
  async findGymLocationById(@Param('locationId') locationId: string) {
    return this.gymLocationsService.findGymLocationById(locationId);
  }

  @Delete(':locationId')
  @RequiredRoles(Role.OWNER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async deleteGymLocation(@Param('locationId') locationId: string) {
    return this.gymLocationsService.deleteGymLocation(locationId);
  }

  @Post(':locationId/staff')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async assignStaffToLocation(
    @Param('locationId') locationId: string,
    @Body() assignUserDto: AssignUserToBranchDto,
  ) {
    return this.gymLocationsService.assignStaffToLocation(
      assignUserDto,
      locationId,
    );
  }

  @Put(':locationId/staff/:userId')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  @RequiredAccessLevel(AccessLevel.MANAGER_ACCESS)
  async updateStaffLocationAccess(
    @Param('locationId') locationId: string,
    @Param('userId') userId: string,
    @Body() updateAccessDto: UpdateUserBranchAccessDto,
  ) {
    return this.gymLocationsService.updateStaffLocationAccess(
      updateAccessDto,
      userId,
      locationId,
    );
  }
}
