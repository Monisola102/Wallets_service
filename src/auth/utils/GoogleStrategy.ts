import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { ConfigType } from '@nestjs/config';
import googleOauthConfig from '../config/google-oauth.config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(googleOauthConfig.KEY)
    private readonly googleConfig: ConfigType<typeof googleOauthConfig>,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: googleConfig.clientID,
      clientSecret: googleConfig.clientSecret,
      callbackURL: `${googleConfig.callbackURL}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  // NestJS automatically handles done() if you return the user
  async validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0].value;
    if (!email) {
      throw new Error('No email found in Google profile');
    }

    // Check or create user in your AuthService
    const user = await this.authService.validateGoogleUser({
      email,
      firstName: profile.name?.givenName || '',
      lastName: profile.name?.familyName || '',
      password: '', // empty because OAuth users don’t use passwords
    });

    return user;
  }
}
