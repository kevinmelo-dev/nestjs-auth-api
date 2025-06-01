import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '@prisma/client';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {

  constructor(private authService: AuthService) {
    super({
      usernameField: 'loginIdentifier', 
      passwordField: 'password',
    });
  }

  async validate(loginIdentifier: string, password: string): Promise<Omit<User, 'password'>> {

    const user = await this.authService.validateUser(loginIdentifier, password);
    
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    
    return user;
  }
}