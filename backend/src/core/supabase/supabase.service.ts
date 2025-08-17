import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient | null;
  private bucketName = 'member-photos';

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    // In local development, Supabase is optional
    if (nodeEnv === 'development') {
      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.logger.log('Supabase client initialized for development');
      } else {
        this.logger.warn('Supabase not configured - photo upload and OAuth features will be disabled');
        this.supabase = null;
      }
    } else {
      // Production requires Supabase
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL and key must be provided in production');
      }
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  get client(): SupabaseClient | null {
    return this.supabase;
  }

  /**
   * Verify JWT token from Supabase Auth
   */
  async verifyToken(token: string) {
    if (!this.supabase) {
      throw new Error('Supabase not configured - token verification not available');
    }
    
    try {
      const { data, error } = await this.supabase.auth.getUser(token);
      
      if (error) {
        throw new Error(`Token verification failed: ${error.message}`);
      }

      return data.user;
    } catch (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  }

  /**
   * Get OAuth URL for provider
   */
  async getOAuthUrl(provider: 'google' | 'facebook' | 'twitter', redirectTo?: string) {
    if (!this.supabase) {
      throw new Error('Supabase not configured - OAuth not available');
    }
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || `${this.configService.get('FRONTEND_URL')}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw new Error(`OAuth URL generation failed: ${error.message}`);
    }

    return data.url;
  }

  /**
   * Exchange code for session (used in callback)
   */
  async exchangeCodeForSession(code: string) {
    if (!this.supabase) {
      throw new Error('Supabase not configured - code exchange not available');
    }
    const { data, error } = await this.supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      throw new Error(`Code exchange failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Refresh session
   */
  async refreshSession(refreshToken: string) {
    if (!this.supabase) {
      throw new Error('Supabase not configured - session refresh not available');
    }
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new Error(`Session refresh failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Sign out user
   */
  async signOut(token: string) {
    if (!this.supabase) {
      throw new Error('Supabase not configured - sign out not available');
    }
    // Set the session first
    await this.supabase.auth.setSession({
      access_token: token,
      refresh_token: '', // We might not have this, but signOut should still work
    });

    const { error } = await this.supabase.auth.signOut();
    
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }

    return { success: true };
  }

  // Photo Upload Methods

  /**
   * Upload member photo to Supabase Storage
   */
  async uploadMemberPhoto(
    memberId: string,
    tenantId: string,
    file: Express.Multer.File
  ): Promise<{ url: string; path: string }> {
    if (!this.supabase) {
      throw new InternalServerErrorException('Photo upload not available - Supabase not configured');
    }
    
    try {
      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('File must be an image');
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('File size must be less than 5MB');
      }

      // Generate unique filename
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${tenantId}/${memberId}/${Date.now()}.${fileExt}`;

      this.logger.log(`Uploading photo for member ${memberId}: ${fileName}`);

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: true // Allow overwriting existing files
        });

      if (error) {
        this.logger.error(`Failed to upload photo: ${error.message}`);
        throw new InternalServerErrorException('Failed to upload photo');
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      this.logger.log(`Photo uploaded successfully: ${publicUrl}`);

      return {
        url: publicUrl,
        path: fileName
      };

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(`Upload failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to upload photo');
    }
  }

  /**
   * Delete member photo from Supabase Storage
   */
  async deleteMemberPhoto(photoPath: string): Promise<boolean> {
    if (!this.supabase) {
      this.logger.warn('Photo deletion not available - Supabase not configured');
      return true; // Don't fail if Supabase not configured
    }
    
    try {
      if (!photoPath) {
        return true; // Nothing to delete
      }

      this.logger.log(`Deleting photo: ${photoPath}`);

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([photoPath]);

      if (error) {
        this.logger.warn(`Failed to delete photo: ${error.message}`);
        return false;
      }

      this.logger.log(`Photo deleted successfully: ${photoPath}`);
      return true;

    } catch (error) {
      this.logger.warn(`Delete failed: ${error.message}`);
      return false; // Don't throw error for delete operations
    }
  }

  /**
   * Extract photo path from URL for deletion
   */
  extractPhotoPath(photoUrl: string): string | null {
    try {
      if (!photoUrl || !photoUrl.includes(this.bucketName)) {
        return null;
      }

      // Extract path after bucket name
      const bucketPath = `/${this.bucketName}/`;
      const pathIndex = photoUrl.indexOf(bucketPath);
      
      if (pathIndex === -1) {
        return null;
      }

      return photoUrl.substring(pathIndex + bucketPath.length);

    } catch (error) {
      this.logger.warn(`Failed to extract photo path from URL: ${photoUrl}`);
      return null;
    }
  }
}
