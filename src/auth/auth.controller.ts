import { Controller, Post, Body, UseGuards, Request, Get, Res, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { FacebookOAuthGuard } from './guards/facebook-oauth.guard';
import { User as UserModel } from '@prisma/client';
import { Response } from 'express';

@Controller('auth') 
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

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
      this.logger.error('Usuário não encontrado no retorno do Google OAuth.');
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Falha na autenticação com o Google.' });
    }

    const loginData = await this.authService.login(req.user as Omit<UserModel, 'password'>);

    res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Autenticação com Google concluída com sucesso.',
      data: loginData,
    });
  }

  @Get('facebook')
  @UseGuards(FacebookOAuthGuard)
  async facebookAuth(@Request() req) {}

  @Get('facebook/callback')
  @UseGuards(FacebookOAuthGuard)
  async facebookAuthRedirect(@Request() req, @Res() res: Response) 
  {
    if (!req.user) {
      this.logger.error('Usuário não encontrado no retorno do Facebook OAuth.');
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Falha na autenticação com o Facebook.' });
    }

    const loginData = await this.authService.login(req.user as Omit<UserModel, 'password'>);
    
    res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Autenticação com Facebook concluída com sucesso.',
      data: loginData,
    });
  }

}