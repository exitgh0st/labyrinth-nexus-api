import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { User, Prisma } from 'generated/prisma';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export type SafeUser = Omit<User, 'password_hash'>;

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  private readonly safeUserSelect: Prisma.UserSelect = {
    id: true,
    username: true,
    role: true,
    is_active: true,
    created_at: true,
    updated_at: true,
    password_hash: false, // explicitly exclude
  };

  async findAll(params?: {
    skip?: number;
    take?: number;
    role?: string;
    is_active?: boolean;
  }): Promise<SafeUser[]> {
    const { skip = 0, take = 10, role, is_active } = params || {};
    
    return this.prisma.user.findMany({
      skip,
      take,
      where: {
        ...(role && { role }),
        ...(is_active !== undefined && { is_active }),
      },
      select: this.safeUserSelect,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number): Promise<SafeUser | null>  {
    return this.prisma.user.findUnique({
      where: { id },
      select: this.safeUserSelect
    });
  }

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        username: createUserDto.username,
        password_hash: hashedPassword, // Transformed
        role: createUserDto.role,
        is_active: createUserDto.is_active ?? true,
      },
      select: this.safeUserSelect
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<SafeUser> {
    return this.prisma.user.update({
      data: updateUserDto,
      where: { id },
      select: this.safeUserSelect
    });
  }

  async updatePassword(id: number, newPassword: string): Promise<SafeUser> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return this.prisma.user.update({
      where: { id },
      data: { password_hash: hashedPassword },
      select: this.safeUserSelect,
    });
  }

  async delete(id: number): Promise<SafeUser> {
    return this.prisma.user.delete({
      where: { id },
      select: this.safeUserSelect
    });
  }
}