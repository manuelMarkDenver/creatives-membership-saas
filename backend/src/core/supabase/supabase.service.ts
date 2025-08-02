import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key must be provided');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Verify JWT token from Supabase Auth
   */
  async verifyToken(token: string) {
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
}
