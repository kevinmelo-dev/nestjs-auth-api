import { Controller, Get, Param, Put, Body, UseGuards, Request, NotFoundException, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { User as UserModel } from '@prisma/client';
import { UserProfileResponseDto, PublicUserProfileResponseDto } from './dto/user-profile.response.dto';
import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const AuthenticatedUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as Omit<UserModel, 'password'>;
  },
);


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@AuthenticatedUser() user: Omit<UserModel, 'password'>) 
  {
    const freshUser = await this.usersService.findOne({ id: user.id });

    if (!freshUser) {
        throw new NotFoundException('Usuário não encontrado.');
    }

    return {
        statusCode: HttpStatus.OK,
        message: "Perfil do usuário logado carregado com sucesso.",
        data: new UserProfileResponseDto(freshUser),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update')
  @HttpCode(HttpStatus.OK)
  async updateMyProfile(
    @AuthenticatedUser() user: Omit<UserModel, 'password'>,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.usersService.updateUser({
      where: { id: user.id },
      data: updateUserDto,
    });
    return {
        statusCode: HttpStatus.OK,
        message: "Perfil do usuário logado atualizado com sucesso.",
        data: new UserProfileResponseDto(updatedUser),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':username')
  async getUserProfile(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new NotFoundException(`Usuário '${username}' não encontrado.`);
    }
    return {
        statusCode: HttpStatus.OK,
        message: "Perfil do usuário carregado com sucesso.",
        data: new PublicUserProfileResponseDto(user),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllUsers() {
    const users = await this.usersService.findAll();
    return {
        statusCode: HttpStatus.OK,
        message: "Lista de usuários carregada com sucesso.",
        data: users.map(user => new PublicUserProfileResponseDto(user)),
    };
  }
}