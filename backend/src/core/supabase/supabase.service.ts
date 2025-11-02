import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient | null;
  private bucketName = 'member-photos';
  private isStorageReady = false;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    this.logger.log(`Environment: ${nodeEnv}`);
    this.logger.log(
      `Supabase URL: ${supabaseUrl ? supabaseUrl : 'NOT CONFIGURED'}`,
    );
    this.logger.log(
      `Anon Key: ${supabaseKey ? 'CONFIGURED' : 'NOT CONFIGURED'}`,
    );
    this.logger.log(
      `Service Role Key: ${serviceRoleKey ? 'CONFIGURED' : 'NOT CONFIGURED'}`,
    );

    // Use anon key for storage operations with proper RLS policies
    // Service role key bypasses RLS which might cause signature verification issues
    const keyToUse = supabaseKey;

    // In local development, Supabase is optional
    if (nodeEnv === 'development') {
      if (supabaseUrl && keyToUse) {
        try {
          this.supabase = createClient(supabaseUrl, keyToUse, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            },
            global: {
              headers: {
                'Cache-Control': 'no-cache',
                Prefer: 'return=minimal',
              },
            },
          });
          this.logger.log(
            'Supabase client initialized for development with anon key',
          );
          this.initializeStorage();
        } catch (error) {
          this.logger.error(
            'Failed to initialize Supabase client:',
            error.message,
          );
          this.supabase = null;
        }
      } else {
        this.logger.warn(
          'Supabase not configured - photo upload and OAuth features will be disabled',
        );
        this.supabase = null;
      }
    } else {
      // Production - try to use Supabase if configured, otherwise disable
      if (!supabaseUrl || !keyToUse) {
        this.logger.warn(
          'Supabase not configured - OAuth features will be disabled',
        );
        this.supabase = null;
        return;
      }
      try {
        this.supabase = createClient(supabaseUrl, keyToUse, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        });
        this.logger.log('Supabase client initialized for production');
        this.initializeStorage();
      } catch (error) {
        this.logger.error(
          'Failed to initialize Supabase client for production:',
          error.message,
        );
        throw error;
      }
    }
  }

  /**
   * Initialize storage - just verify connectivity
   */
  private async initializeStorage() {
    if (!this.supabase) return;

    try {
      // Try to get public URL for test - this doesn't require admin permissions
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl('test-connectivity-check.jpg');

      if (urlData?.publicUrl) {
        this.logger.log(`Storage bucket '${this.bucketName}' is accessible`);
        this.logger.log(`Storage URL format: ${urlData.publicUrl}`);
        this.isStorageReady = true;
      } else {
        this.logger.warn(
          `Could not generate public URLs for bucket '${this.bucketName}'`,
        );
      }

      // Optional: Try to list buckets if we have permissions (won't fail if we don't)
      try {
        const { data: buckets, error: listError } =
          await this.supabase.storage.listBuckets();
        if (!listError && buckets) {
          const bucketExists = buckets.some(
            (bucket) => bucket.name === this.bucketName,
          );
          if (bucketExists) {
            this.logger.log(
              `Confirmed: Storage bucket '${this.bucketName}' exists`,
            );
          } else {
            this.logger.warn(
              `Warning: Bucket '${this.bucketName}' not found in bucket list`,
            );
          }
        }
      } catch (listError) {
        // Ignore list errors - we don't need admin permissions for uploads
        this.logger.debug(
          'Could not list buckets (this is normal with anon key)',
        );
      }
    } catch (error) {
      this.logger.warn(`Storage initialization failed: ${error.message}`);
      // Don't fail the service initialization for storage issues
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
      throw new Error(
        'Supabase not configured - token verification not available',
      );
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
  async getOAuthUrl(
    provider: 'google' | 'facebook' | 'twitter',
    redirectTo?: string,
  ) {
    if (!this.supabase) {
      throw new Error('Supabase not configured - OAuth not available');
    }
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo:
          redirectTo ||
          `${this.configService.get('FRONTEND_URL')}/auth/callback`,
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
    const { data, error } =
      await this.supabase.auth.exchangeCodeForSession(code);

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
      throw new Error(
        'Supabase not configured - session refresh not available',
      );
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
    file: Express.Multer.File,
  ): Promise<{ url: string; path: string }> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        'Photo upload not available - Supabase not configured',
      );
    }

    // For storage operations, create a separate client with service role key to bypass RLS
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');

    const storageClient = serviceRoleKey
      ? createClient(supabaseUrl!, serviceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        })
      : this.supabase;

    try {
      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('File must be an image');
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('File size must be less than 5MB');
      }

      // Generate consistent filename (always overwrite as profile.jpg)
      const fileName = `${tenantId}/${memberId}/profile.jpg`;

      this.logger.log(`Uploading photo for member ${memberId}: ${fileName}`);

      // Upload to Supabase Storage (with explicit overwrite)
      const { data, error } = await storageClient.storage
        .from(this.bucketName)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: true, // Force overwrite existing files
        });

      if (error) {
        this.logger.error(`Supabase upload error:`, {
          message: error.message,
          details: error,
          fileName,
          bucketName: this.bucketName,
          fileSize: file.size,
          mimeType: file.mimetype,
        });
        throw new InternalServerErrorException(
          `Failed to upload photo: ${error.message}`,
        );
      }

      // Get public URL with cache busting
      const { data: urlData } = storageClient.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      // Add cache busting parameter to force browser refresh
      const cacheBuster = Date.now();
      const publicUrl = `${urlData.publicUrl}?v=${cacheBuster}`;

      this.logger.log(`Photo uploaded successfully: ${publicUrl}`);

      return {
        url: publicUrl,
        path: fileName,
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
      this.logger.warn(
        'Photo deletion not available - Supabase not configured',
      );
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
