import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { userSelect } from './selects/user-select';
import { Prisma } from 'generated/prisma';
import { safeUserSelect } from './selects/safe-user-select';

export type User = Prisma.UserGetPayload<{
  select: typeof userSelect;
}>;

export type SafeUser = Prisma.UserGetPayload<{
  select: typeof safeUserSelect;
}>;

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    const { password, ...dtoWithoutPassword } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        passwordHash: hashedPassword,
        ...dtoWithoutPassword
      },
      select: safeUserSelect
    });
  }

  async findAll(params?: FindAllUsersDto): Promise<SafeUser[]> {
    const { skip = 0, take = 10, role, isActive } = params || {};
  
  return this.prisma.user.findMany({
    skip,
    take,
    where: {
      ...(role !== undefined && {
        userRoles: {
          some: {
            role: {
              name: role,
            },
          },
        },
      }),
      ...(isActive !== undefined && { isActive }),
    },
    select: safeUserSelect,
    orderBy: { createdAt: 'desc' },
  });
  }

  async findOne(id: string): Promise<SafeUser | null>  {
    return this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect
    });
  }

  async findById(id: string): Promise<SafeUser | null>  {
    return this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect
    });
  }

  // Should only be used by Auth Service
  async findByEmail(email: string): Promise<User | null>  {
    return this.prisma.user.findUnique({
      where: { email },
      select: userSelect
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<SafeUser> {
    return this.prisma.user.update({
      data: updateUserDto,
      where: { id },
      select: safeUserSelect
    });
  }

  async updatePassword(id: string, newPassword: string): Promise<SafeUser> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return this.prisma.user.update({
      where: { id },
      data: { passwordHash: hashedPassword },
      select: safeUserSelect,
    });
  }

  async delete(id: string): Promise<SafeUser> {
    return this.prisma.user.delete({
      where: { id },
      select: safeUserSelect
    });
  }
}