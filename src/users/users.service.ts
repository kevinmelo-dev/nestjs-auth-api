// src/users/users.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(userWhereUniqueInput: Prisma.UserWhereUniqueInput): Promise<User | null> {

    const user = await this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user;
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {

    if (data.username) {
      const existingByUsername = await this.findByUsername(data.username);

      if (existingByUsername) {
        throw new ConflictException('Esse nome de usuário já pertence a uma conta.');
      }
    }

    const existingByEmail = await this.findByEmail(data.email);

    if (existingByEmail) {
      throw new ConflictException('Esse e-mail já pertence a uma conta.');
    }
    
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      data.password = hashedPassword;
    }

    return this.prisma.user.create({
      data,
    });
  }

  async updateUser(params: { where: Prisma.UserWhereUniqueInput; data: Prisma.UserUpdateInput; }): Promise<User> {
    const { where, data } = params;

    if (data.username && typeof data.username === 'string') {
        const existingUser = await this.findByUsername(data.username);
        if (existingUser && existingUser.id !== (await this.findOne(where))?.id) {
            throw new ConflictException('Esse nome de usuário já pertence a uma conta.');
        }
    }

    if (data.email && typeof data.email === 'string') {
        const existingUser = await this.findByEmail(data.email);
        if (existingUser && existingUser.id !== (await this.findOne(where))?.id) {
            throw new ConflictException('Esse e-mail já pertence a uma conta.');
        }
    }

    try {

      return this.prisma.user.update({
        ...params,
      });

    } catch (error) {

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Usuário não encontrado.');
      }
      
      throw error;
    }
  }

  omitPassword(user: User) {
    const { password, ...result } = user;
    return result;
  }
}