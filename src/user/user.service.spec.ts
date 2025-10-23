import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockSafeUser = {
    id: 1,
    username: 'testuser',
    role: 'user',
    is_active: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  const mockUserWithPassword = {
    ...mockSafeUser,
    password_hash: 'hashedPassword123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users with default pagination', async () => {
      const users = [mockSafeUser];
      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {},
        select: {
          id: true,
          username: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          password_hash: false,
        },
        orderBy: { created_at: 'desc' },
      });
      expect(result).toEqual(users);
    });

    it('should return users with custom pagination', async () => {
      const users = [mockSafeUser];
      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findAll({ skip: 10, take: 20 });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 20,
        where: {},
        select: expect.any(Object),
        orderBy: { created_at: 'desc' },
      });
      expect(result).toEqual(users);
    });

    it('should filter users by role', async () => {
      const users = [mockSafeUser];
      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findAll({ role: 'admin' });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { role: 'admin' },
        select: expect.any(Object),
        orderBy: { created_at: 'desc' },
      });
      expect(result).toEqual(users);
    });

    it('should filter users by is_active', async () => {
      const users = [mockSafeUser];
      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findAll({ is_active: false });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { is_active: false },
        select: expect.any(Object),
        orderBy: { created_at: 'desc' },
      });
      expect(result).toEqual(users);
    });

    it('should filter users by role and is_active', async () => {
      const users = [mockSafeUser];
      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findAll({ role: 'admin', is_active: true });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { role: 'admin', is_active: true },
        select: expect.any(Object),
        orderBy: { created_at: 'desc' },
      });
      expect(result).toEqual(users);
    });

    it('should not exclude password_hash from select', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockSafeUser]);

      await service.findAll();

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            password_hash: false,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockSafeUser);

      const result = await service.findOne(1);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          username: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          password_hash: false,
        },
      });
      expect(result).toEqual(mockSafeUser);
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        select: expect.any(Object),
      });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        password: 'Password123!',
        role: 'user',
        is_active: true,
      };

      const hashedPassword = 'hashedPassword123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(mockSafeUser);

      const result = await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: createUserDto.username,
          password_hash: hashedPassword,
          role: createUserDto.role,
          is_active: createUserDto.is_active,
        },
        select: {
          id: true,
          username: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          password_hash: false,
        },
      });
      expect(result).toEqual(mockSafeUser);
    });

    it('should set is_active to true by default if not provided', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        password: 'Password123!',
        role: 'user',
      };

      const hashedPassword = 'hashedPassword123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(mockSafeUser);

      await service.create(createUserDto);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          is_active: true,
        }),
        select: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        username: 'updateduser',
        role: 'admin',
      };

      const updatedUser = { ...mockSafeUser, ...updateUserDto };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateUserDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        data: updateUserDto,
        where: { id: 1 },
        select: {
          id: true,
          username: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          password_hash: false,
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should update only provided fields', async () => {
      const updateUserDto: UpdateUserDto = {
        is_active: false,
      };

      const updatedUser = { ...mockSafeUser, is_active: false };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateUserDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        data: updateUserDto,
        where: { id: 1 },
        select: expect.any(Object),
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('updatePassword', () => {
    it('should update user password with hashed value', async () => {
      const newPassword = 'NewPassword123!';
      const hashedPassword = 'newHashedPassword123';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.update.mockResolvedValue(mockSafeUser);

      const result = await service.updatePassword(1, newPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password_hash: hashedPassword },
        select: {
          id: true,
          username: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          password_hash: false,
        },
      });
      expect(result).toEqual(mockSafeUser);
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      mockPrismaService.user.delete.mockResolvedValue(mockSafeUser);

      const result = await service.delete(1);

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          username: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          password_hash: false,
        },
      });
      expect(result).toEqual(mockSafeUser);
    });
  });

  describe('safeUserSelect', () => {
    it('should never include password_hash in any query', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockSafeUser]);
      mockPrismaService.user.findUnique.mockResolvedValue(mockSafeUser);
      mockPrismaService.user.create.mockResolvedValue(mockSafeUser);
      mockPrismaService.user.update.mockResolvedValue(mockSafeUser);
      mockPrismaService.user.delete.mockResolvedValue(mockSafeUser);

      await service.findAll();
      await service.findOne(1);
      await service.create({
        username: 'test',
        password: 'test',
        role: 'user',
      });
      await service.update(1, { username: 'test' });
      await service.updatePassword(1, 'newpass');
      await service.delete(1);

      // Check all calls to ensure password_hash is false
      const allCalls = [
        ...mockPrismaService.user.findMany.mock.calls,
        ...mockPrismaService.user.findUnique.mock.calls,
        ...mockPrismaService.user.create.mock.calls,
        ...mockPrismaService.user.update.mock.calls,
        ...mockPrismaService.user.delete.mock.calls,
      ];

      allCalls.forEach((call) => {
        const selectObject = call[0]?.select;
        if (selectObject) {
          expect(selectObject.password_hash).toBe(false);
        }
      });
    });
  });
});