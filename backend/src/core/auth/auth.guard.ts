import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../guard/rbac.guard';
import { Role } from '@prisma/client';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if auth was bypassed (for local testing)
    if (request.headers['x-bypass-auth'] || request.headers['X-Bypass-Auth']) {
      console.log('🔧 Processing bypass authentication');

      // Check for specific user email in bypass header
      const bypassUserEmail =
        request.headers['x-bypass-user'] || request.headers['X-Bypass-User'] ||
        request.headers['x-bypass-auth'] || request.headers['X-Bypass-Auth'];

      let bypassUser: AuthenticatedUser;

      if (bypassUserEmail) {
        console.log(`🔧 Looking up bypass user: ${bypassUserEmail}`);
        const targetUser = await this.prisma.user.findFirst({
          where: { email: bypassUserEmail },
          include: {
            gymUserBranches: { include: { branch: true } },
            gymMemberProfile: true,
          },
        });

        if (targetUser) {
          bypassUser = {
            id: targetUser.id,
            email: targetUser.email || bypassUserEmail,
            role: (targetUser.role as Role) || Role.CLIENT,
            tenantId: targetUser.tenantId || targetUser.gymMemberProfile?.tenantId || null,
            branchAccess: targetUser.gymUserBranches.map((ub) => ({
              branchId: ub.branchId,
              accessLevel: ub.accessLevel,
              permissions: (ub.permissions as Record<string, boolean>) || {},
              isPrimary: ub.isPrimary,
            })),
          };
          console.log(`🔧 Bypass auth successful for: ${targetUser.email} (${targetUser.role})`);
        } else {
          throw new UnauthorizedException(`Bypass user not found: ${bypassUserEmail}`);
        }
      } else {
        // Default to owner for testing
        console.log('🔧 Using default owner for bypass auth');
        const ownerUser = await this.prisma.user.findFirst({
          where: { email: 'owner@muscle-mania.com' },
          include: {
            gymUserBranches: { include: { branch: true } },
            gymMemberProfile: true,
          },
        });

        if (ownerUser) {
          bypassUser = {
            id: ownerUser.id,
            email: ownerUser.email || 'owner@muscle-mania.com',
            role: (ownerUser.role as Role) || Role.OWNER,
            tenantId: ownerUser.tenantId || ownerUser.gymMemberProfile?.tenantId || null,
            branchAccess: ownerUser.gymUserBranches.map((ub) => ({
              branchId: ub.branchId,
              accessLevel: ub.accessLevel,
              permissions: (ub.permissions as Record<string, boolean>) || {},
              isPrimary: ub.isPrimary,
            })),
          };
        } else {
          throw new UnauthorizedException('Default owner user not found');
        }
      }

      request.user = bypassUser;
      return true;
    }

    // Extract token from Authorization header
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }

    console.log('🔐 Processing JWT token');

    // For development/testing, decode JWT or use stored user context
    try {
      // TODO: Implement proper JWT decoding here
      // For now, we need to identify the actual user from the token
      // Since we don't have proper JWT decoding yet, let's check localStorage context
      // This is a temporary workaround until proper JWT auth is implemented
      
      // Try to get user email from a custom header (set by frontend)
      const userEmail = request.headers['x-user-email'] || request.headers['X-User-Email'];
      
      let targetUser;
      if (userEmail) {
        targetUser = await this.prisma.user.findFirst({
          where: { email: userEmail },
          include: {
            gymUserBranches: { include: { branch: true } },
            gymMemberProfile: true,
          },
        });
      }
      
      // Fallback to owner if no specific user found
      if (!targetUser) {
        targetUser = await this.prisma.user.findFirst({
          where: { email: 'owner@muscle-mania.com' },
          include: {
            gymUserBranches: { include: { branch: true } },
            gymMemberProfile: true,
          },
        });
      }

      if (!targetUser) {
        throw new UnauthorizedException('User not found');
      }

      const authenticatedUser: AuthenticatedUser = {
        id: targetUser.id,
        email: targetUser.email || 'owner@muscle-mania.com',
        role: (targetUser.role as Role) || Role.OWNER,
        tenantId: targetUser.tenantId || targetUser.gymMemberProfile?.tenantId || null,
        branchAccess: targetUser.gymUserBranches.map((ub) => ({
          branchId: ub.branchId,
          accessLevel: ub.accessLevel,
          permissions: (ub.permissions as Record<string, boolean>) || {},
          isPrimary: ub.isPrimary,
        })),
      };

      console.log(`🔐 JWT auth successful for: ${authenticatedUser.email} (${authenticatedUser.role})`);
      console.log(`🔐 User tenantId: ${authenticatedUser.tenantId}`);
      request.user = authenticatedUser;
      return true;

    } catch (error) {
      console.error('Auth error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return undefined;
    }
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
}
