import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantsService } from '../tenants/tenants.service';
import { BusinessCategory } from '@prisma/client';

// Decorator to specify allowed business types for specific endpoints
export const AllowedBusinessTypes = (...types: BusinessCategory[]) =>
  SetMetadata('allowedBusinessTypes', types);

// Decorator to skip business type guard entirely
export const SkipBusinessTypeGuard = () =>
  SetMetadata('skipBusinessTypeGuard', true);

@Injectable()
export class BusinessTypeGuard implements CanActivate {
  constructor(
    private tenantsService: TenantsService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if guard should be skipped for this endpoint
    const skipGuard = this.reflector.getAllAndOverride<boolean>(
      'skipBusinessTypeGuard',
      [context.getHandler(), context.getClass()],
    );

    if (skipGuard) {
      return true;
    }

    // Get tenant ID from request params, query, or headers
    const tenantId =
      request.params?.tenantId ||
      request.query?.tenantId ||
      request.headers?.['x-tenant-id'];

    if (!tenantId) {
      throw new NotFoundException(
        'Tenant ID is required. Provide it as a URL parameter, query parameter, or x-tenant-id header.',
      );
    }

    // Validate tenant exists
    const tenant = await this.tenantsService.getTenant(tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // Check if specific business types are required for this endpoint
    const allowedTypes = this.reflector.getAllAndOverride<BusinessCategory[]>(
      'allowedBusinessTypes',
      [context.getHandler(), context.getClass()],
    );

    if (allowedTypes && allowedTypes.length > 0) {
      if (!allowedTypes.includes(tenant.category)) {
        throw new ForbiddenException(
          `This endpoint is only available for ${allowedTypes.join(', ')} businesses. Current tenant is ${tenant.category}.`,
        );
      }
    }

    // Store tenant for later use in request
    request.tenant = tenant;

    return true;
  }
}
