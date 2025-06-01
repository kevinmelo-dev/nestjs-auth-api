import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    const createUserDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    const hashedPassword = 'hashedPassword123';
    const mockUser = { id: '1', ...createUserDto, password: hashedPassword, provider: 'local', createdAt: new Date(), updatedAt: new Date(), name: null, providerId: null };

it('should create a new user successfully', async () => {
      const originalPassword = createUserDto.password; 

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prisma.user.findUnique.mockResolvedValue(null); 
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.createUser(createUserDto); 

      expect(bcrypt.hash).toHaveBeenCalledWith(originalPassword, 10); 

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: createUserDto.username } });
      expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { username: createUserDto.username } }));
      expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { email: createUserDto.email } }));


      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: mockUser.username, 
          email: mockUser.email,
          password: hashedPassword, 
        },
      });

      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if username already exists', async () => {
      prisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.username === createUserDto.username) {
          return Promise.resolve(mockUser); 
        }
        return Promise.resolve(null);
      });

      await expect(service.createUser(createUserDto)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      prisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.email === createUserDto.email) {
          return Promise.resolve(mockUser); 
        }
        return Promise.resolve(null);
      });
        
      await expect(service.createUser(createUserDto)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return a user if email is found', async () => {
      const email = 'test@example.com';
      const mockUser = { id: '1', email, username: 'test', password: 'pwd', provider: 'local', createdAt: new Date(), updatedAt: new Date(), name: null, providerId: null };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail(email);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(result).toEqual(mockUser);
    });

    it('should return null if email is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.findByEmail('notfound@example.com');
      expect(result).toBeNull();
    });
  });

});