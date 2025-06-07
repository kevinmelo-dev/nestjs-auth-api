import { IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
    @IsNotEmpty({ message: 'O nome de usuário é obrigatório.' })
    @IsString()
    loginIdentifier: string;

    @IsNotEmpty({ message: 'A senha é obrigatória.' })
    @IsString()
    password: string;
}