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

    // Extract token from Authorization header
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      let dbUser;
      
      // Try to decode as custom token first (base64 encoded JSON)
      try {
        const decodedToken = JSON.parse(Buffer.from(token, 'base64').toString());
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
        branchAccess: dbUser.userBranches.map(ub => ({
          branchId: ub.branchId,
          accessLevel: ub.accessLevel,
          permissions: ub.permissions as Record<string, boolean> || {},
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
