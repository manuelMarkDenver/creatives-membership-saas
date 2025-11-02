import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_REDIRECT_URI ||
        'http://localhost:5000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): any {
    try {
      const { id, emails, displayName, name, photos } = profile;

      // Extract user info from Google profile
      const googleUser = {
        googleId: id,
        email: emails?.[0]?.value,
        firstName: name?.givenName || displayName?.split(' ')[0] || '',
        lastName:
          name?.familyName || displayName?.split(' ').slice(1).join(' ') || '',
        displayName: displayName,
        profilePicture: photos?.[0]?.value,
        provider: 'google',
      };

      // Validate that we have required fields
      if (!googleUser.email) {
        return done(new Error('No email provided by Google'), null);
      }

      // Return user info - the auth service will handle user creation/linking
      return done(null, googleUser);
    } catch (error) {
      return done(error, null);
    }
  }
}
