import { User } from '@prisma/client';

export class UserProfileResponseDto {
    id: string;
    username: string;
    email: string;
    name: string | null;
    provider: string | null;
    createdAt: Date;
    updatedAt: Date;

    constructor(user: User) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.name = user.name;
    this.provider = user.provider;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    }
}

export class PublicUserProfileResponseDto {
    id: string;
    username: string;
    name: string | null;
    createdAt: Date;

    constructor(user: User) {
    this.id = user.id;
    this.username = user.username;
    this.name = user.name;
    this.createdAt = user.createdAt;
    }
}