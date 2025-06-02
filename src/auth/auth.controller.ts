import { Controller, Post, Body, UseGuards, Request, Get, Res, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { FacebookOAuthGuard } from './guards/facebook-oauth.guard';
import { User as UserModel } from '@prisma/client';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config'; 

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly frontendSocialCallbackUrl: string;

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    this.frontendSocialCallbackUrl = this.configService.get<string>('FRONTEND_SOCIAL_CALLBACK_URL') || 'http://localhost:3001/social-callback';

    if (!this.frontendSocialCallbackUrl) {
      this.logger.warn(
        'FRONTEND_SOCIAL_CALLBACK_URL não está definida no .env! O redirecionamento para o frontend após login social pode falhar. Usando valor padrão http://localhost:3001/social-callback',
      );
      
      this.frontendSocialCallbackUrl = 'http://localhost:3001/social-callback';
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerUserDto: RegisterUserDto) 
  {
    const user = await this.authService.register(registerUserDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Usuário registrado com sucesso',
      data: user,
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req, @Body() loginUserDto: LoginUserDto) 
  {
    return this.authService.login(req.user);
  }

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Request() req) {}

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Request() req, @Res() res: Response) 
  {
    if (!req.user) {
      this.logger.error('Google OAuth: Usuário não encontrado no objeto de requisição após callback.');
      return res.redirect(`${this.frontendSocialCallbackUrl}?error=google_authentication_failed&message=UserNotFound`);
    }

    const loginResult = await this.authService.login(req.user as Omit<UserModel, 'password'>);
    const token = loginResult.accessToken;

    this.logger.log(`Google Login: Redirecionando para o frontend com token: ${this.frontendSocialCallbackUrl}?token=...`);
    res.redirect(`${this.frontendSocialCallbackUrl}?token=${token}`);
  }

  @Get('facebook')
  @UseGuards(FacebookOAuthGuard)
  async facebookAuth(@Request() req) {}

  @Get('facebook/callback')
  @UseGuards(FacebookOAuthGuard)
  async facebookAuthRedirect(@Request() req, @Res() res: Response) {
    if (!req.user) {
      this.logger.error('Facebook OAuth: Usuário não encontrado no objeto de requisição após callback.');
      return res.redirect(`${this.frontendSocialCallbackUrl}?error=facebook_authentication_failed&message=UserNotFound`);
    }

    const loginResult = await this.authService.login(req.user as Omit<UserModel, 'password'>);
    const token = loginResult.accessToken;

    this.logger.log(`Facebook Login: Redirecionando para o frontend com token: ${this.frontendSocialCallbackUrl}?token=...`);
    res.redirect(`${this.frontendSocialCallbackUrl}?token=${token}`);
  }
}