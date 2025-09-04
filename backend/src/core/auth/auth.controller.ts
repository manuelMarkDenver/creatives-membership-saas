import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  Req,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { IsEmail, IsString, MinLength } from 'class-validator';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Email/Password login
   * POST /auth/login
   */
  @Post('login')
  async loginWithPassword(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          tenant: true,
        },
      });

      if (!user || !user.password) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Generate a simple token (in production, use proper JWT)
      const token = Buffer.from(
        JSON.stringify({
          userId: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          timestamp: Date.now(),
        }),
      ).toString('base64');

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name || `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            tenantId: user.tenantId,
            tenant: user.tenant,
          },
          token,
        },
        message: 'Login successful',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Login error:', error);
      throw new InternalServerErrorException('Login failed');
    }
  }

  /**
   * Initiate OAuth login
   * GET /auth/login?provider=google&redirect_to=http://localhost:3000/dashboard
   */
  @Get('login')
  async login(
    @Query('provider') provider: string,
    @Res() res: Response,
    @Query('redirect_to') redirectTo?: string,
  ) {
    if (!provider || !['google', 'facebook', 'twitter'].includes(provider)) {
      throw new BadRequestException(
        'Valid provider (google, facebook, twitter) is required',
      );
    }

    try {
      const oauthUrl = await this.supabaseService.getOAuthUrl(
        provider as 'google' | 'facebook' | 'twitter',
        redirectTo,
      );

      // Redirect user to OAuth provider
      return res.redirect(oauthUrl);
    } catch (error) {
      throw new InternalServerErrorException(
        `OAuth initiation failed: ${error.message}`,
      );
    }
  }

  /**
   * Handle OAuth callback
   * GET /auth/callback?code=AUTH_CODE&state=STATE
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Res() res: Response,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string,
  ) {
    // Handle OAuth errors
    if (error) {
      const message = errorDescription || error;
      console.error('OAuth callback error:', message);
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(message)}`,
      );
    }

    if (!code) {
      throw new BadRequestException('Authorization code is required');
    }

    try {
      // Exchange code for session
      const session = await this.supabaseService.exchangeCodeForSession(code);

      if (!session.session) {
        throw new Error('Failed to create session');
      }

      const { access_token, refresh_token, user } = session.session;

      // In a real app, you might want to:
      // 1. Create/update user record in your database
      // 2. Set secure HTTP-only cookies
      // 3. Create JWT tokens for your app

      // For now, redirect to frontend with tokens (not recommended for production)
      const params = new URLSearchParams({
        access_token,
        refresh_token: refresh_token || '',
        user_id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      });

      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/success?${params.toString()}`,
      );
    } catch (error) {
      console.error('OAuth callback processing error:', error);
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent('Authentication failed')}`,
      );
    }
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  @Get('refresh')
  async refresh(@Query('refresh_token') refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    try {
      const session = await this.supabaseService.refreshSession(refreshToken);

      return {
        success: true,
        data: {
          access_token: session.session?.access_token,
          refresh_token: session.session?.refresh_token,
          expires_at: session.session?.expires_at,
          user: session.user,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Token refresh failed: ${error.message}`,
      );
    }
  }

  /**
   * Sign out user
   * POST /auth/logout
   */
  @Get('logout')
  async logout(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Access token is required');
    }

    try {
      await this.supabaseService.signOut(token);

      return {
        success: true,
        message: 'Successfully signed out',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Sign out failed: ${error.message}`,
      );
    }
  }

  /**
   * Get current user info
   * GET /auth/me?token=ACCESS_TOKEN or with x-bypass-auth header
   */
  @Get('me')
  async getMe(@Query('token') token: string, @Req() request: Request) {
    // Check for bypass auth header for local development
    const bypassAuth =
      request.headers['x-bypass-auth'] || request.headers['X-Bypass-Auth'];

    if (bypassAuth) {
      console.warn('⚠️  Auth bypassed for /auth/me endpoint');
      // Return the Super Admin user for development
      const superAdmin = await this.prisma.user.findUnique({
        where: { email: 'admin@creatives-saas.com' },
        include: { tenant: true },
      });

      if (superAdmin) {
        // Super Admins should not have a tenantId assigned
        // They have global access across all tenants
        let effectiveTenantId = superAdmin.tenantId;
        let effectiveTenant = superAdmin.tenant;

        if (superAdmin.role === 'SUPER_ADMIN') {
          // Super Admins should always have null tenantId for global access
          effectiveTenantId = null;
          effectiveTenant = null;
        }

        return {
          success: true,
          user: {
            id: superAdmin.id,
            email: superAdmin.email,
            name:
              superAdmin.name ||
              `${superAdmin.firstName} ${superAdmin.lastName}`,
            firstName: superAdmin.firstName,
            lastName: superAdmin.lastName,
            role: superAdmin.role,
            tenantId: effectiveTenantId,
            tenant: effectiveTenant,
            created_at: superAdmin.createdAt,
          },
        };
      }

      // Fallback to mock user if Super Admin not found
      return {
        success: true,
        user: {
          id: 'dev-user-123',
          email: 'dev@example.com',
          name: 'Development User',
          role: 'SUPER_ADMIN',
          tenantId: null,
          avatar_url: null,
          provider: 'development',
          created_at: new Date().toISOString(),
        },
      };
    }

    if (!token) {
      throw new BadRequestException('Access token is required');
    }

    try {
      const user = await this.supabaseService.verifyToken(token);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name,
          avatar_url: user.user_metadata?.avatar_url,
          provider: user.app_metadata?.provider,
          created_at: user.created_at,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `User verification failed: ${error.message}`,
      );
    }
  }
}
