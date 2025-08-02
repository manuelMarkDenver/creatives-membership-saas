import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RequestWithTenant extends Request {
  tenantId?: string;
  tenantSlug?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const request = req as RequestWithTenant;
    
    // Skip tenant extraction for certain routes
    const skipRoutes = ['/auth', '/health', '/'];
    if (skipRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    let tenantId: string | undefined;
    let tenantSlug: string | undefined;

    // 1. Try to get tenant from header (highest priority)
    tenantId = req.headers['x-tenant-id'] as string;
    
    // 2. Try to get from subdomain (e.g., gym1.localhost:5000 -> gym1)
    if (!tenantId) {
      const hostname = req.hostname;
      const parts = hostname.split('.');
      
      // If subdomain exists and it's not 'www' or 'api'
      if (parts.length > 1 && !['www', 'api', 'localhost'].includes(parts[0])) {
        tenantSlug = parts[0];
        this.logger.debug(`Extracted tenant slug from subdomain: ${tenantSlug}`);
      }
    }

    // 3. Try to get from query parameter
    if (!tenantId && !tenantSlug) {
      tenantId = req.query.tenantId as string;
      tenantSlug = req.query.tenant as string;
    }

    // 4. Try to get from request body (for POST/PUT requests)
    if (!tenantId && !tenantSlug && req.body) {
      tenantId = req.body.tenantId;
      tenantSlug = req.body.tenant;
    }

    // 5. Try to get from URL params (e.g., /tenants/:tenantId/users)
    if (!tenantId && !tenantSlug && req.params) {
      tenantId = req.params.tenantId;
      tenantSlug = req.params.tenant;
    }

    // If we have a slug but no ID, we'll need to resolve it later
    // The business logic will handle slug -> ID conversion
    if (tenantId || tenantSlug) {
      request.tenantId = tenantId;
      request.tenantSlug = tenantSlug;
      
      this.logger.debug(`Tenant context set - ID: ${tenantId}, Slug: ${tenantSlug}`);
    } else {
      // For some routes, tenant might be optional
      // Let the business logic decide if it's required
      this.logger.debug('No tenant context found in request');
    }

    next();
  }
}
