import { Injectable, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto';
import { User } from '@prisma/client';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    async validateUser(loginIdentifier: string, pass: string): Promise<Omit<User, 'password'> | null> 
    {
        let user = await this.usersService.findByEmail(loginIdentifier);

        if (!user) {
            user = await this.usersService.findByUsername(loginIdentifier);
        }

        if (user && user.password && await bcrypt.compare(pass, user.password)) {
            const { password, ...result } = user;
            return result;
        }

        return null;
    }

    async login(user: Omit<User, 'password'>) 
    {
        const payload: JwtPayload = { username: user.username, sub: user.id, email: user.email };
        const accessToken = this.jwtService.sign(payload);
        this.logger.log(`Token gerado para o usuário: ${user.email}`);

        return {
            accessToken: accessToken,
            user: this.usersService.omitPassword(user as User),
        };
    }

    async register(registerUserDto: RegisterUserDto): Promise<Omit<User, 'password'>> {
        const { username, email, password } = registerUserDto;

        try {
            const newUser = await this.usersService.createUser({
                username,
                email,
                password,
                provider: 'local',
            });

            return this.usersService.omitPassword(newUser) as Omit<User, 'password'>;

        } catch (error) {

            if (error instanceof ConflictException) {
                this.logger.warn(`Tentativa de registro com conflito: ${error.message}`);
                throw new ConflictException('Nome de usuário ou e-mail já cadastrado.');
            }

            this.logger.error(`Falha inesperada ao registrar usuário: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Ocorreu um erro inesperado ao tentar registrar o usuário. Tente novamente mais tarde.');
        }
    }
    
    async findOrCreateUserForSocialLogin(
        profile: {
        email: string;
        provider: 'google' | 'facebook' | 'apple';
        providerId: string;
        firstName?: string;
        lastName?: string;
        }
    ): Promise<User> 
    {
        let user = await this.usersService.findByEmail(profile.email);

        if (user) {
            if (!user.providerId || (user.provider === profile.provider && user.providerId !== profile.providerId)) {
                this.logger.log(`Atualizando provedor e ID do provedor para o usuário existente: ${profile.email}`);

                user = await this.usersService.updateUser({
                    where: { id: user.id },
                    data: { provider: profile.provider, providerId: profile.providerId },
                });
            }

            return user;

        } else {

            let baseUsername = profile.email.split('@')[0];
            let uniqueUsername = baseUsername;
            let existingUserByUsername = await this.usersService.findByUsername(uniqueUsername);
            let suffixAttempts = 0;

            while (existingUserByUsername) {
                suffixAttempts++;
                if (suffixAttempts > 5) { 
                    uniqueUsername = `${baseUsername}-${Math.random().toString(36).substring(2, 8)}`; 
                } else {
                    uniqueUsername = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
                }
                
                existingUserByUsername = await this.usersService.findByUsername(uniqueUsername);
            }

            const name = profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : profile.firstName;

            this.logger.log(`Criando novo usuário social: ${profile.email} com username: ${uniqueUsername}`);

            return this.usersService.createUser({
                email: profile.email,
                username: uniqueUsername,
                name: name || null,
                provider: profile.provider,
                providerId: profile.providerId,
            });
        }
    }
}