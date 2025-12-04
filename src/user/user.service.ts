// user.service.ts
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { userSelect } from './selects/user-select';
import { safeUserSelect } from './selects/safe-user-select';
import { FormattedSafeUser, FormattedUser, transformUser, transformSafeUser } from './utils/transform-user.util';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto): Promise<FormattedSafeUser> {
    const { password, roleIds = [], ...dtoWithoutPassword } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        passwordHash: hashedPassword,
        ...dtoWithoutPassword,
        ...(roleIds.length > 0 && {
          userRoles: {
            create: roleIds.map(roleId => ({ roleId }))
          }
        })
      },
      select: safeUserSelect
    });

    return transformSafeUser(user);
  }

  async findAll(params?: FindAllUsersDto): Promise<{ data: FormattedSafeUser[]; total: number }> {
    const { skip = 0, take = 10, role, isActive } = params || {};

    const where = {
      ...(role && {
        userRoles: {
          some: {
            role: { name: role }
          }
        }
      }),
      ...(isActive !== undefined && { isActive })
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        where,
        select: safeUserSelect,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      data: data.map(transformSafeUser),
      total
    };
  }

  async findOne(id: string): Promise<FormattedSafeUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect
    });

    return user ? transformSafeUser(user) : null;
  }

  async findById(id: string): Promise<FormattedSafeUser | null> {
    return this.findOne(id);
  }

  // Should only be used by Auth Service
  async findByEmail(email: string): Promise<FormattedUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: userSelect
    });

    return user ? transformUser(user) : null;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<FormattedSafeUser> {
    const { roleIds, password, ...userData } = updateUserDto;

    // Handle password hashing
    if (password) {
      userData.passwordHash = await this.getPasswordHash(password);
      userData.passwordChangedAt = new Date();
    }

    // If roleIds are provided, update in a transaction
    if (roleIds !== undefined) {
      const user = await this.prisma.$transaction(async (tx) => {
        // Delete existing roles
        await tx.userRole.deleteMany({ where: { userId: id } });

        // Update user and create new roles
        return tx.user.update({
          where: { id },
          data: {
            ...userData,
            ...(roleIds.length > 0 && {
              userRoles: {
                create: roleIds.map(roleId => ({ roleId }))
              }
            })
          },
          select: safeUserSelect
        });
      });

      return transformSafeUser(user);
    }

    // Simple update without role changes
    const user = await this.prisma.user.update({
      where: { id },
      data: userData,
      select: safeUserSelect
    });

    return transformSafeUser(user);
  }

  async getPasswordHash(password: string): Promise<string> {
    const hashedPassword = await bcrypt.hash(password, 10);

    return hashedPassword;
  }

  async updatePassword(id: string, newPassword: string, currentPassword?: string): Promise<FormattedSafeUser> {
    if (!newPassword) {
      throw new UnauthorizedException('New password is required');
    }

    // If currentPassword is provided, verify it
    if (currentPassword) {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { passwordHash: true }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    const hashedPassword = await this.getPasswordHash(newPassword);
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash: hashedPassword,
        passwordChangedAt: new Date()
      },
      select: safeUserSelect
    });

    return transformSafeUser(user);
  }

  async delete(id: string): Promise<FormattedSafeUser> {
    const user = await this.prisma.user.delete({
      where: { id },
      select: safeUserSelect
    });

    return transformSafeUser(user);
  }
}