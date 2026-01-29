import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class AuthEventsService {
  constructor(private prisma: PrismaService) {}

  async logAuthEvent(data: {
    tenantId?: string;
    userId?: string;
    type: string;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
    meta?: any;
  }) {
    try {
      const result = await this.prisma.authEvent.create({
        data,
      });
      return result;
    } catch (error: any) {
      // Handle foreign key constraint violations (user doesn't exist)
      if (
        error.code === 'P2003' &&
        error.meta?.constraint?.includes('AuthEvent_userId_fkey')
      ) {
        // Try again without userId
        try {
          const result = await this.prisma.authEvent.create({
            data: {
              ...data,
              userId: undefined, // Remove invalid userId
            },
          });
          return result;
        } catch (retryError) {
          throw retryError;
        }
      }

      // Re-throw other errors
      throw error;
    }
  }

  // Helper methods for common events
  async logLogin(
    userId: string,
    tenantId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.logAuthEvent({
      userId,
      tenantId,
      type: 'LOGIN',
      ipAddress,
      userAgent,
    });
  }

  async logLogout(userId: string, tenantId?: string, reason?: string) {
    return this.logAuthEvent({
      userId,
      tenantId,
      type: 'LOGOUT',
      reason,
    });
  }

  async logLoginFailure(
    tenantId?: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.logAuthEvent({
      tenantId,
      type: 'LOGIN_FAILED',
      reason,
      ipAddress,
      userAgent,
    });
  }

  async logTokenExpired(userId: string, tenantId?: string) {
    return this.logAuthEvent({
      userId,
      tenantId,
      type: 'TOKEN_EXPIRED',
    });
  }
}
