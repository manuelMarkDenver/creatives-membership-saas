import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  Req,
  UseGuards,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from './auth.guard';
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

      // Check if user is deleted
      if (user.deletedAt) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Generate a simple token (in production, use proper JWT)
      const token = Buffer.from(
        JSON.stringify({
          userId: user.id,
          email: user.email,
          role: user.globalRole, // Use globalRole for consistency
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
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.globalRole || user.role, // Use globalRole if available, fallback to role
            globalRole: user.globalRole, // Keep for compatibility
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
    * GET /auth/me (requires Authorization header or x-bypass-auth header)
    */
  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Req() request: Request) {
    // The AuthGuard has already authenticated the user and attached it to the request
    const authenticatedUser = (request as any).user;

    if (!authenticatedUser) {
      throw new BadRequestException('User not authenticated');
    }

    // Get the full user data from database
    const user = await this.prisma.user.findUnique({
      where: { id: authenticatedUser.id },
      include: { tenant: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Handle tenant logic for Super Admin
    let effectiveTenantId = user.tenantId;
    let effectiveTenant = user.tenant;

    if (user.globalRole === 'SUPER_ADMIN') {
      // Super Admins should always have null tenantId for global access
      effectiveTenantId = null;
      effectiveTenant = null;
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.globalRole, // Return globalRole as role for frontend compatibility
        tenantId: effectiveTenantId,
        tenant: effectiveTenant,
        created_at: user.createdAt,
      },
    };
  }
}
