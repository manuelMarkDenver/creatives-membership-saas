import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { Role, AccessLevel, BusinessCategory } from '@prisma/client';

// Decorators for RBAC
export const RequiredRoles = (...roles: Role[]) => SetMetadata('roles', roles);
export const RequiredAccessLevel = (level: AccessLevel) =>
  SetMetadata('accessLevel', level);
export const RequiredPermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);
export const SkipRBAC = () => SetMetadata('skipRBAC', true);

// Interface for authenticated user with RBAC info
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
  branchAccess?: {
    branchId: string;
    accessLevel: AccessLevel;
    permissions?: Record<string, boolean>;
    isPrimary: boolean;
  }[];
}

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }



    // Get tenant and branch context
    const tenantId =
      request.params?.tenantId ||
      request.query?.tenantId ||
      request.headers?.['x-tenant-id'];
    const branchId =
      request.params?.branchId ||
      request.query?.branchId ||
      request.headers?.['x-branch-id'];

    // Load user's full RBAC info if not already loaded
    if (!user.branchAccess || user.branchAccess.length === 0) {
      await this.loadUserRBACInfo(user);
    }

    // Check role-based access
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0) {
      if (!this.hasRole(user, requiredRoles)) {
        throw new ForbiddenException(
          `Access denied. Required roles: ${requiredRoles.join(', ')}`,
        );
      }
    }

    // Check access level (for both branch and tenant operations)
    const requiredAccessLevel = this.reflector.getAllAndOverride<AccessLevel>(
      'accessLevel',
      [context.getHandler(), context.getClass()],
    );

    if (requiredAccessLevel) {
      if (branchId) {
        // Branch-specific access check
        if (!this.hasBranchAccess(user, branchId, requiredAccessLevel)) {
          throw new ForbiddenException('Insufficient branch access permissions');
        }
      } else {
        // Tenant-level access check based on global role
        if (!this.hasTenantAccess(user, requiredAccessLevel)) {
          throw new ForbiddenException('Insufficient tenant access permissions');
        }
      }
    }

    // Check specific permissions
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!this.hasPermissions(user, branchId, requiredPermissions)) {
        throw new ForbiddenException(
          `Missing required permissions: ${requiredPermissions.join(', ')}`,
        );
      }
    }

    // Store user context in request
    request.userContext = {
      user,
      tenantId,
      branchId,
      canAccessBranch: branchId ? this.hasBranchAccess(user, branchId) : true,
      accessLevel: branchId
        ? this.getUserBranchAccessLevel(user, branchId)
        : null,
    };

    return true;
  }

  private async loadUserRBACInfo(user: AuthenticatedUser): Promise<void> {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        gymUserBranches: {
          include: {
            branch: true,
          },
        },
        gymMemberProfile: true,
      },
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    // Use role for platform-level permissions
    user.role = (dbUser.role as Role) || Role.CLIENT;
    // Use User.tenantId first, fallback to gymMemberProfile.tenantId for gym members
    user.tenantId = dbUser.tenantId || dbUser.gymMemberProfile?.tenantId || null;
    user.branchAccess = dbUser.gymUserBranches.map((ub) => ({
      branchId: ub.branchId,
      accessLevel: ub.accessLevel,
      permissions: (ub.permissions as Record<string, boolean>) || {},
      isPrimary: ub.isPrimary,
    }));
  }

  private hasRole(user: AuthenticatedUser, requiredRoles: Role[]): boolean {
    // SUPER_ADMIN has access to everything
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    // OWNER has access to all tenant-level operations
    if (user.role === Role.OWNER && requiredRoles.includes(Role.OWNER)) {
      return true;
    }

    // MANAGER has access to tenant-level operations
    if (user.role === Role.MANAGER && requiredRoles.includes(Role.MANAGER)) {
      return true;
    }

    // STAFF has access to tenant-level operations
    if (user.role === Role.STAFF && requiredRoles.includes(Role.STAFF)) {
      return true;
    }

    return requiredRoles.includes(user.role);
  }

  private hasTenantAccess(user: AuthenticatedUser, requiredLevel: AccessLevel): boolean {
    // SUPER_ADMIN has full access
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    // OWNER has full access to tenant operations
    if (user.role === Role.OWNER) {
      return true;
    }

    // MANAGER has manager-level access
    if (user.role === Role.MANAGER) {
      return this.accessLevelHierarchy(requiredLevel) <= this.accessLevelHierarchy(AccessLevel.MANAGER_ACCESS);
    }

    // STAFF has staff-level access
    if (user.role === Role.STAFF) {
      return this.accessLevelHierarchy(requiredLevel) <= this.accessLevelHierarchy(AccessLevel.STAFF_ACCESS);
    }

    // CLIENT has read-only access
    if (user.role === Role.CLIENT) {
      return this.accessLevelHierarchy(requiredLevel) <= this.accessLevelHierarchy(AccessLevel.READ_ONLY);
    }

    return false;
  }

  private hasBranchAccess(
    user: AuthenticatedUser,
    branchId: string,
    requiredLevel?: AccessLevel,
  ): boolean {
    // SUPER_ADMIN and OWNER have access to all branches
    if (user.role === Role.SUPER_ADMIN || user.role === Role.OWNER) {
      return true;
    }

    const branchAccess = user.branchAccess?.find(
      (ba) => ba.branchId === branchId,
    );
    if (!branchAccess) {
      return false;
    }

    if (!requiredLevel) {
      return true; // Any access level is sufficient
    }

    // Check if user's access level meets requirement
    return (
      this.accessLevelHierarchy(branchAccess.accessLevel) >=
      this.accessLevelHierarchy(requiredLevel)
    );
  }

  private hasPermissions(
    user: AuthenticatedUser,
    branchId: string | undefined,
    requiredPermissions: string[],
  ): boolean {
    // SUPER_ADMIN has all permissions
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    // OWNER has all permissions within their tenant
    if (user.role === Role.OWNER) {
      return true;
    }

    if (!branchId) {
      return false; // Need branch context for permission checks
    }

    const branchAccess = user.branchAccess?.find(
      (ba) => ba.branchId === branchId,
    );
    if (!branchAccess) {
      return false;
    }

    // Check if user has all required permissions
    return requiredPermissions.every(
      (permission) => branchAccess.permissions?.[permission] === true,
    );
  }

  private getUserBranchAccessLevel(
    user: AuthenticatedUser,
    branchId: string,
  ): AccessLevel | null {
    if (user.role === Role.SUPER_ADMIN || user.role === Role.OWNER) {
      return AccessLevel.FULL_ACCESS;
    }

    const branchAccess = user.branchAccess?.find(
      (ba) => ba.branchId === branchId,
    );
    return branchAccess?.accessLevel || null;
  }

  private accessLevelHierarchy(level: AccessLevel): number {
    const hierarchy = {
      [AccessLevel.READ_ONLY]: 1,
      [AccessLevel.STAFF_ACCESS]: 2,
      [AccessLevel.MANAGER_ACCESS]: 3,
      [AccessLevel.FULL_ACCESS]: 4,
    };
    return hierarchy[level] || 0;
  }
}

// Helper function to get accessible branches for a user
export async function getUserAccessibleBranches(
  prisma: PrismaService,
  userId: string,
  tenantId?: string,
): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      gymUserBranches: {
        include: {
          branch: true,
        },
      },
      gymMemberProfile: true,
    },
  });

  if (!user) {
    return [];
  }

  // SUPER_ADMIN and OWNER can access all branches
  if (user.role === Role.SUPER_ADMIN) {
    const allBranches = await prisma.branch.findMany({
      where: tenantId ? { tenantId } : {},
      select: { id: true },
    });
    return allBranches.map((b) => b.id);
  }

  if (user.role === Role.OWNER) {
    const profileTenantId = user.gymMemberProfile?.tenantId;
    const tenantBranches = await prisma.branch.findMany({
      where: { tenantId: profileTenantId || undefined },
      select: { id: true },
    });
    return tenantBranches.map((b) => b.id);
  }

  // Return branches the user has explicit access to
  return user.gymUserBranches.map((ub) => ub.branchId);
}
