// src/auth/oauth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { GoogleProfile } from './strategies/google.strategy';
import { AuthResult } from './interfaces/auth-result.interface';

@Injectable()
export class OAuthService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async handleOAuthLogin(
    profile: GoogleProfile,
    res: Response,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResult> {
    if (!profile.email) {
      throw new UnauthorizedException(
        'No email provided by Google. Please ensure email permissions are granted.',
      );
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email.toLowerCase() },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      // Create new user from OAuth profile
      user = await this.createUserFromOAuthProfile(profile);
    } else {
      // Update existing user with OAuth info if needed
      user = await this.updateUserOAuthInfo(user.id, profile);
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Transform user to safe format
    const { userRoles, ...userWithoutRoles } = user;
    const safeUser = {
      ...userWithoutRoles,
      roles: userRoles.map((ur) => ur.role),
    };

    // Generate tokens and create session
    return this.authService['generateTokens'](
      safeUser,
      ipAddress,
      userAgent,
    );
  }

  private async createUserFromOAuthProfile(profile: GoogleProfile) {
    // Get default USER role
    const userRole = await this.prisma.role.findUnique({
      where: { name: 'USER' },
    });

    if (!userRole) {
      throw new Error('Default USER role not found');
    }

    // Generate a random password (user won't use it for OAuth login)
    const randomPassword = this.generateRandomPassword();
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    return this.prisma.user.create({
      data: {
        email: profile.email.toLowerCase(),
        emailVerified: profile.emailVerified,
        emailVerifiedAt: new Date(),
        passwordHash: hashedPassword,
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: `${profile.firstName} ${profile.lastName}`.trim(),
        avatarUrl: profile.picture,
        isActive: true,
        userRoles: {
          create: [
            {
              roleId: userRole.id,
              grantedAt: new Date(),
            },
          ],
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  private async updateUserOAuthInfo(
    userId: string,
    profile: GoogleProfile,
  ) {
    // Update user info if OAuth profile has newer/better data
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        // Update email verification if not already verified
        emailVerified: true,
        emailVerifiedAt: new Date(),
        // Update profile picture if user doesn't have one
        ...(profile.picture && {
          avatarUrl: profile.picture,
        }),
        // Update names if they're empty
        ...(!profile.firstName && { firstName: profile.firstName }),
        ...(!profile.lastName && { lastName: profile.lastName }),
        lastLoginAt: new Date(),
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  private generateRandomPassword(length: number = 32): string {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    const crypto = require('crypto');
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * Link a Google account to an existing authenticated user
   */
  async linkOAuthAccount(
    userId: string,
    profile: GoogleProfile,
  ): Promise<void> {
    // Check if email is already used by another account
    const existingUser = await this.prisma.user.findUnique({
      where: { email: profile.email.toLowerCase() },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new UnauthorizedException(
        'This email is already associated with another account',
      );
    }

    // Update user with OAuth info
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: profile.picture || undefined,
      },
    });
  }

  /**
   * Unlink Google account from user
   */
  async unlinkOAuthAccount(userId: string): Promise<void> {
    // Ensure user has a password set before unlinking OAuth
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException(
        'Cannot unlink Google account. Please set a password first.',
      );
    }

    // Additional cleanup could go here if you store OAuth provider info
  }
}