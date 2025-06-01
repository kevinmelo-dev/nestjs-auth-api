// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service'; 

const mockUsersService = {
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  createUser: jest.fn(),
  omitPassword: jest.fn((user) => { 
    if (!user) return null;
    const { password, ...result } = user;
    return result;
  }),
};

const mockJwtService = {
  sign: jest.fn(),
};

const mockPrismaServiceAuth = {
};

jest.mock('bcrypt'); 

describe('AuthService', () => {
  let service: AuthService;
  let usersService: typeof mockUsersService;
  let jwtService: typeof mockJwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaServiceAuth },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    const mockUser = { id: '1', username: 'test', email: 'test@example.com', password: 'hashedPassword', provider: 'local', createdAt: new Date(), updatedAt: new Date(), name: null, providerId: null };

    it('should return user if validation is successful with email', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.omitPassword.mockReturnValue({ ...mockUser, password: undefined });


      const result = await service.validateUser('test@example.com', 'password');
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
      expect(result).toEqual(usersService.omitPassword(mockUser));
    });
    
    it('should return user if validation is successful with username', async () => {
      usersService.findByEmail.mockResolvedValue(null); 
      usersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.omitPassword.mockReturnValue({ ...mockUser, password: undefined });

      const result = await service.validateUser('test', 'password');
      expect(usersService.findByUsername).toHaveBeenCalledWith('test');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
      expect(result).toEqual(usersService.omitPassword(mockUser));
    });

    it('should return null if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      const result = await service.validateUser('unknown', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); 
      const result = await service.validateUser('test@example.com', 'wrongpassword');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return an access token and user', async () => {
      const mockUser = { id: '1', username: 'test', email: 'test@example.com', provider: 'local', createdAt: new Date(), updatedAt: new Date(), name: null, providerId: null };
      const token = 'test-token';
      jwtService.sign.mockReturnValue(token);
      usersService.omitPassword.mockImplementation(user => { delete user.password; return user; });


      const result = await service.login(mockUser as any); 
      expect(jwtService.sign).toHaveBeenCalledWith({ username: 'test', sub: '1', email: 'test@example.com' });
      expect(result.accessToken).toEqual(token);
      expect(result.user).toEqual(mockUser);
    });
  });

  describe('register', () => {
    const registerDto = { username: 'newuser', email: 'new@example.com', password: 'password123' };
    const mockRegisteredUser = { id: '2', ...registerDto, provider:'local', createdAt: new Date(), updatedAt: new Date(), name: null, providerId: null };
    
    it('should register a new user successfully', async () => {
      usersService.createUser.mockResolvedValue(mockRegisteredUser);
      usersService.omitPassword.mockImplementation(user => { delete user.password; return user; });


      const result = await service.register(registerDto);
      expect(usersService.createUser).toHaveBeenCalledWith({
        ...registerDto,
        provider: 'local',
      });
      expect(result).toEqual(usersService.omitPassword(mockRegisteredUser));
    });

    it('should re-throw ConflictException if createUser throws it', async () => {
      usersService.createUser.mockRejectedValue(new ConflictException('User already exists'));
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

});