import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { safeUserSelect } from './selects/safe-user.select';
import { Prisma, User } from 'generated/prisma';

export type SafeUser = Prisma.UserGetPayload<{
  select: typeof safeUserSelect;
}>;

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        username: createUserDto.username,
        password_hash: hashedPassword, // Transformed
        role: createUserDto.role,
        is_active: createUserDto.is_active ?? true,
      },
      select: safeUserSelect
    });
  }

  async findAll(params?: FindAllUsersDto): Promise<SafeUser[]> {
    const { skip = 0, take = 10, role, is_active } = params || {};
    
    return this.prisma.user.findMany({
      skip,
      take,
      where: {
        ...(role && { role }),
        ...(is_active !== undefined && { is_active }),
      },
      select: safeUserSelect,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number): Promise<SafeUser | null>  {
    return this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect
    });
  }

  async findById(userId: number): Promise<SafeUser | null>  {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: safeUserSelect
    });
  }

  // Should only be used by Auth Service
  async findByUsername(username: string): Promise<User | null>  {
    return this.prisma.user.findUnique({
      where: { username }
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<SafeUser> {
    return this.prisma.user.update({
      data: updateUserDto,
      where: { id },
      select: safeUserSelect
    });
  }

  async updatePassword(id: number, newPassword: string): Promise<SafeUser> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return this.prisma.user.update({
      where: { id },
      data: { password_hash: hashedPassword },
      select: safeUserSelect,
    });
  }

  async delete(id: number): Promise<SafeUser> {
    return this.prisma.user.delete({
      where: { id },
      select: safeUserSelect
    });
  }
}