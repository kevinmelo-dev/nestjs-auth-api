import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
    @IsNotEmpty({ message: 'O nome de usuário é obrigatório.' })
    @IsString()
    username: string;

    @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
    @IsEmail({}, { message: 'O e-mail informado não é válido.' })
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
    password: string;
}