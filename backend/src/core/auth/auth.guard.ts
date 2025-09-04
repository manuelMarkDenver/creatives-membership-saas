import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../guard/rbac.guard';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if auth was bypassed (for local testing)
    if (request.headers['x-bypass-auth'] || request.headers['X-Bypass-Auth']) {
      // SECURITY: NEVER allow bypass auth in production
      if (process.env.NODE_ENV === 'production') {
        console.error(
          '🚨 SECURITY ALERT: Bypass auth attempt in PRODUCTION environment - BLOCKED!',
        );
        throw new UnauthorizedException(
          'Bypass authentication is not allowed in production',
        );
      }

      // Additional safety: Check for explicit bypass enable flag
      const bypassEnabled =
        process.env.ENABLE_AUTH_BYPASS === 'true' ||
        process.env.NODE_ENV === 'development';
      if (!bypassEnabled) {
        console.error(
          '🚨 SECURITY ALERT: Bypass auth not explicitly enabled - BLOCKED!',
        );
        throw new UnauthorizedException('Bypass authentication is not enabled');
      }

      console.warn('⚠️  Auth guard bypassed for local testing/scripting');

      // Check for specific user email in bypass header for dynamic user selection
      const bypassUserEmail =
        request.headers['x-bypass-user'] || request.headers['X-Bypass-User'];

      let bypassUser: AuthenticatedUser;

      if (bypassUserEmail) {
        // Dynamic bypass: authenticate as the specified user
        try {
          const targetUser = await this.prisma.user.findFirst({
            where: {
              email: bypassUserEmail,
              isActive: true,
            },
            include: {
              userBranches: {
                include: {
                  branch: true,
                },
              },
              tenant: true,
            },
          });

          if (targetUser) {
            bypassUser = {
              id: targetUser.id,
              email: targetUser.email || bypassUserEmail,
              role: targetUser.role,
              tenantId: targetUser.tenantId,
              branchAccess: targetUser.userBranches.map((ub) => ({
                branchId: ub.branchId,
                accessLevel: ub.accessLevel,
                permissions: (ub.permissions as Record<string, boolean>) || {},
                isPrimary: ub.isPrimary,
              })),
            };
            console.log(
              `🔧 Bypassing auth as: ${targetUser.email} (${targetUser.role}) - Tenant: ${targetUser.tenant?.name || 'None'}`,
            );
          } else {
            console.warn(
              `⚠️  Bypass user not found: ${bypassUserEmail}, falling back to Super Admin`,
            );
            throw new Error('User not found');
          }
        } catch (error) {
          console.error(
            `Failed to find bypass user ${bypassUserEmail}:`,
            error,
          );
          // Fallback to super admin
          const realSuperAdmin = await this.prisma.user.findFirst({
            where: {
              role: 'SUPER_ADMIN',
              email: 'admin@creatives-saas.com',
            },
            include: {
              userBranches: {
                include: {
                  branch: true,
                },
              },
            },
          });

          if (realSuperAdmin) {
            bypassUser = {
              id: realSuperAdmin.id,
              email: realSuperAdmin.email || 'admin@creatives-saas.com',
              role: realSuperAdmin.role,
              tenantId: realSuperAdmin.tenantId || null,
              branchAccess: realSuperAdmin.userBranches.map((ub) => ({
                branchId: ub.branchId,
                accessLevel: ub.accessLevel,
                permissions: (ub.permissions as Record<string, boolean>) || {},
                isPrimary: ub.isPrimary,
              })),
            };
          } else {
            // Final fallback
            bypassUser = {
              id: 'bypass-user-fallback',
              email: 'admin@creatives-saas.com',
              role: 'SUPER_ADMIN',
              tenantId: null,
              branchAccess: [],
            };
          }
        }
      } else {
        // Default bypass: use super admin
        try {
          const realSuperAdmin = await this.prisma.user.findFirst({
            where: {
              role: 'SUPER_ADMIN',
              email: 'admin@creatives-saas.com',
            },
            include: {
              userBranches: {
                include: {
                  branch: true,
                },
              },
            },
          });

          if (realSuperAdmin) {
            bypassUser = {
              id: realSuperAdmin.id,
              email: realSuperAdmin.email || 'admin@creatives-saas.com',
              role: realSuperAdmin.role,
              tenantId: realSuperAdmin.tenantId || null,
              branchAccess: realSuperAdmin.userBranches.map((ub) => ({
                branchId: ub.branchId,
                accessLevel: ub.accessLevel,
                permissions: (ub.permissions as Record<string, boolean>) || {},
                isPrimary: ub.isPrimary,
              })),
            };
            console.log('🔧 Bypassing auth as Super Admin');
          } else {
            // Fallback to fake user if real user not found
            bypassUser = {
              id: 'bypass-user-fallback',
              email: 'admin@creatives-saas.com',
              role: 'SUPER_ADMIN',
              tenantId: null,
              branchAccess: [],
            };
          }
        } catch (error) {
          console.error('Failed to find real super admin for bypass:', error);
          bypassUser = {
            id: 'bypass-user-fallback',
            email: 'admin@creatives-saas.com',
            role: 'SUPER_ADMIN',
            tenantId: null,
            branchAccess: [],
          };
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

    try {
      let dbUser;

      // Try to decode as custom token first (base64 encoded JSON)
      try {
        const decodedToken = JSON.parse(
          Buffer.from(token, 'base64').toString(),
        );
        if (decodedToken.userId && decodedToken.email) {
          // This is our custom token
          dbUser = await this.prisma.user.findUnique({
            where: { id: decodedToken.userId },
            include: {
              userBranches: {
                include: {
                  branch: true,
                },
              },
            },
          });
        }
      } catch (customTokenError) {
        // Not a custom token, try Supabase
      }

      // If custom token didn't work, try Supabase token
      if (!dbUser) {
        try {
          const supabaseUser = await this.supabaseService.verifyToken(token);

          dbUser = await this.prisma.user.findUnique({
            where: { email: supabaseUser.email },
            include: {
              userBranches: {
                include: {
                  branch: true,
                },
              },
            },
          });
        } catch (supabaseError) {
          // In development, if Supabase fails, fall back to bypass auth
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              'Supabase token verification failed in development, using auth bypass',
            );
            // Trigger bypass auth behavior - create fallback super admin user
            const bypassUser: AuthenticatedUser = {
              id: 'development-bypass-user',
              email: 'dev@creatives-saas.com',
              role: 'SUPER_ADMIN',
              tenantId: null,
              branchAccess: [],
            };
            request.user = bypassUser;
            console.log('🔧 Using development bypass auth as fallback');
            return true;
          }
          throw supabaseError;
        }
      }

      if (!dbUser) {
        throw new UnauthorizedException('User not found in system');
      }

      // Create authenticated user object with RBAC info
      const authenticatedUser: AuthenticatedUser = {
        id: dbUser.id,
        email: dbUser.email || '',
        role: dbUser.role,
        tenantId: dbUser.tenantId,
        branchAccess: dbUser.userBranches.map((ub) => ({
          branchId: ub.branchId,
          accessLevel: ub.accessLevel,
          permissions: (ub.permissions as Record<string, boolean>) || {},
          isPrimary: ub.isPrimary,
        })),
      };

      // Attach user to request object for use in controllers
      request.user = authenticatedUser;

      return true;
    } catch (error) {
      console.error('Auth error:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
