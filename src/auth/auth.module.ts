import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module'; 
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';

@Module({
    imports: [
        UsersModule, 
        PassportModule.register({ defaultStrategy: 'jwt' }), 
        JwtModule.registerAsync({
        imports: [ConfigModule], 
        inject: [ConfigService], 
        useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET'),
            signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRATION_TIME'),
            },
        }),
        }),
        ConfigModule, 
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        LocalStrategy,
        JwtStrategy,
        GoogleStrategy,   
        FacebookStrategy,  
    ],
    exports: [AuthService, JwtModule], 
})

export class AuthModule {}