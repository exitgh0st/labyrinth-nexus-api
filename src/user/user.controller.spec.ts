import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-user-password.dto';
import { FindAllUsersDto } from './dto/find-all-users.dto';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
    delete: jest.fn(),
  };

  const mockUser = {
    id: 1,
    username: 'testuser',
    role: 'user',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        password: 'Password123!',
        role: 'user',
        is_active: true,
      };

      mockUserService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const query: FindAllUsersDto = {
        skip: 1,
        take: 10,
      };

      const expectedResult = {
        data: [mockUser],
        total: 1,
        skip: 1,
        take: 10,
      };

      mockUserService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should filter users by role', async () => {
      const query: FindAllUsersDto = {
        skip: 1,
        take: 10,
        role: 'admin',
      };

      const expectedResult = {
        data: [{ ...mockUser, role: 'admin' }],
        total: 1,
        skip: 1,
        take: 10,
      };

      mockUserService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });

    it('should filter users by is_active', async () => {
      const query: FindAllUsersDto = {
        skip: 1,
        take: 10,
        is_active: false,
      };

      const expectedResult = {
        data: [{ ...mockUser, is_active: false }],
        total: 1,
        skip: 1,
        take: 10,
      };

      mockUserService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      mockUserService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(service.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        username: 'updateduser',
        role: 'admin',
      };

      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUserService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(1, updateUserDto);

      expect(service.update).toHaveBeenCalledWith(1, updateUserDto);
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const updatePasswordDto: UpdatePasswordDto = {
        password: 'NewPassword123!',
      };

      const expectedResult = { message: 'Password updated successfully' };
      mockUserService.updatePassword.mockResolvedValue(expectedResult);

      const result = await controller.updatePassword(1, updatePasswordDto);

      expect(service.updatePassword).toHaveBeenCalledWith(
        1,
        updatePasswordDto.password,
      );
      expect(service.updatePassword).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      mockUserService.delete.mockResolvedValue(undefined);

      const result = await controller.remove(1);

      expect(service.delete).toHaveBeenCalledWith(1);
      expect(service.delete).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });
});