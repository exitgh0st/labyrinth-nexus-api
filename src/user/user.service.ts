import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { User, Prisma } from 'generated/prisma';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper function to exclude the password_hash field from a user object.
   * @param user The user object returned from the database.
   * @returns The user object without the password_hash field.
   */
  excludePasswordHash(user: User): Omit<User, 'password_hash'> {
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    role?: string;
    is_active?: boolean;
  }): Promise<Partial<User>[]> {
    const { skip = 0, take = 10, role, is_active } = params || {};
    
    return this.prisma.user.findMany({
      skip,
      take,
      where: {
        ...(role && { role }),
        ...(is_active !== undefined && { is_active }),
      },
      select: {
        id: true,
        username: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async update(where: Prisma.UserWhereUniqueInput, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async delete(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}