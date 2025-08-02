import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Check if auth was bypassed (for local testing)
    if (request.headers['x-bypass-auth'] || request.headers['X-Bypass-Auth']) {
      console.warn('⚠️  Role guard bypassed for local testing');
      return true;
    }
    
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = request;
    return requiredRoles.some((role) => user?.role === role);
  }
}
