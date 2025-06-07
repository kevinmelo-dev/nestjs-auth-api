import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Request, 
  Get, 
  Res, 
  HttpCode, 
  HttpStatus, 
  Logger,
  UnauthorizedException, 
  BadRequestException,   
  InternalServerErrorException  
} from '@nestjs/common';
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
    private readonly isProduction: boolean;

    constructor(
        private authService: AuthService,
        private configService: ConfigService,
    ) {
        this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';

        if (this.isProduction) {
            const prodUrl = this.configService.get<string>('FRONTEND_SOCIAL_CALLBACK_URL_PROD');

            if (!prodUrl) {
                const errorMessage = 'URL de callback para login social não configurada.';
                this.logger.error(errorMessage);

                throw new InternalServerErrorException(errorMessage);
            }

            this.frontendSocialCallbackUrl = prodUrl;

        } else {
            const devUrl = this.configService.get<string>('FRONTEND_SOCIAL_CALLBACK_URL_DEV');

            if (!devUrl) {
                const errorMessage = 'FRONTEND_SOCIAL_CALLBACK_URL_DEV não está definida nas variáveis de ambiente.';
                this.logger.error(errorMessage);
                this.logger.warn(`Usando valor padrão para desenvolvimento: http://localhost:3001/social-callback`);
                this.frontendSocialCallbackUrl = 'http://localhost:3001/social-callback';

            } else {
                this.frontendSocialCallbackUrl = devUrl;
            }
        }
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerUserDto: RegisterUserDto) 
    {
        try {
            const user = await this.authService.register(registerUserDto);

            return {
                statusCode: HttpStatus.CREATED,
                message: 'Usuário registrado com sucesso.',
                data: user,
            };

        } catch (error) {
            this.logger.error(`Erro ao registrar usuário: ${error.message}`, error.stack);

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException('Erro no servidor.');
        }
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Request() req, @Body() loginUserDto: LoginUserDto) 
    {
        try {
            const loginResult = await this.authService.login(req.user);
            this.logger.log(`Usuário ${req.user.email} logado com sucesso.`); 
            
            return loginResult;

        } catch (error) {
            this.logger.error(`Erro durante o login de ${loginUserDto.loginIdentifier}: ${error.message}`, error.stack);

            throw new UnauthorizedException('Credenciais inválidas.'); 
        }
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

            return res.redirect(`${this.frontendSocialCallbackUrl}?error=authentication_failed`);
        }

        try {
            const loginResult = await this.authService.login(req.user as Omit<UserModel, 'password'>);
            const token = loginResult.accessToken;

            res.cookie('access_token', token, {
                httpOnly: true,       
                secure: this.isProduction,
                sameSite: 'lax',      
                maxAge: 3600000,      
            });

            this.logger.log(`Google Login: Redirecionando para o frontend ${this.frontendSocialCallbackUrl} com HttpOnly cookie.`);

            return res.redirect(this.frontendSocialCallbackUrl); 

        } catch (error) {
            this.logger.error('Erro durante o login social do Google:', error.message, error.stack);

            return res.redirect(`${this.frontendSocialCallbackUrl}?error=authentication_failed`);
        }
    }

    @Get('facebook')
    @UseGuards(FacebookOAuthGuard)
    async facebookAuth(@Request() req) {}

    @Get('facebook/callback')
    @UseGuards(FacebookOAuthGuard)
    async facebookAuthRedirect(@Request() req, @Res() res: Response) 
    {
        if (!req.user) {
            this.logger.error('Facebook OAuth: Usuário não encontrado no objeto de requisição após callback.');

            return res.redirect(`${this.frontendSocialCallbackUrl}?error=authentication_failed`);
        }

        try {
            const loginResult = await this.authService.login(req.user as Omit<UserModel, 'password'>);
            const token = loginResult.accessToken;

            res.cookie('access_token', token, {
                httpOnly: true,
                secure: this.isProduction,
                sameSite: 'lax',
                maxAge: 3600000,
            });

            this.logger.log(`Facebook Login: Redirecionando para o frontend ${this.frontendSocialCallbackUrl} com HttpOnly cookie.`);

            return res.redirect(this.frontendSocialCallbackUrl);

        } catch (error) {
            this.logger.error('Erro durante o login social do Facebook:', error.message, error.stack);

            return res.redirect(`${this.frontendSocialCallbackUrl}?error=authentication_failed`);
        }
    }
}