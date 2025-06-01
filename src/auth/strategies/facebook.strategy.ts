import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  private readonly logger = new Logger(FacebookStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('FACEBOOK_APP_ID');
    const clientSecret = configService.get<string>('FACEBOOK_APP_SECRET');
    const callbackURL = configService.get<string>('FACEBOOK_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Facebook OAuth não configurado.');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'emails', 'name'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile, done: (err?: Error | null, user?: Express.User, info?: any) => void): Promise<any> 
  {
    const { name, emails, id: facebookId } = profile;
    if (!emails || emails.length === 0) {
      this.logger.error('O Facebook não retornou um e-mail.');
      return done(new Error('Nenhum e-mail encontrado no perfil do Facebook ou e-mail é privado.'), false);
    }

    const facebookProfile = {
      email: emails[0].value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      provider: 'facebook' as 'facebook',
      providerId: facebookId,
    };

    try {
      const user = await this.authService.findOrCreateUserForSocialLogin(facebookProfile);
      done(null, user);
    } catch (error) {
      this.logger.error(`Erro durante a validação do Facebook OAuth: ${error.message}`, error.stack);
      done(error, false);
    }
  }
}