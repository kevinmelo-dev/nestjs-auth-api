import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Google OAuth não configurado.');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback): Promise<any> 
  {
    const { name, emails, id: googleId } = profile;

    if (!emails || emails.length === 0) {
      this.logger.error('O Google não retornou um e-mail.');
      return done(new Error('Nenhum e-mail encontrado no perfil do Google'), false);
    }

    const googleProfile = {
      email: emails[0].value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      provider: 'google' as 'google',
      providerId: googleId,
    };

    try {
      const user = await this.authService.findOrCreateUserForSocialLogin(googleProfile);
      done(null, user); 

    } catch (error) {

      this.logger.error(`Erro durante o login com Google: ${error.message}`, error.stack);
      done(error, false);
    }
  }
}