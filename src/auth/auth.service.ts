import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserService } from 'src/user/user.service';
import type { Response, CookieOptions } from 'express';
import { AuthResult } from './interfaces/auth-result.interface';
import { User } from 'generated/prisma';
import { SafeSession, SessionService } from 'src/session/session.service';
import { FormattedSafeUser, FormattedUser } from 'src/user/utils/transform-user.util';
import { PrismaService } from 'src/shared/services/prisma.service';

const refreshTokenCookieKey = "refreshToken";

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private userService: UserService,
        private sessionService: SessionService,
        private configService: ConfigService,
        private prisma: PrismaService
    ) { }

    /**
     * Helper to get cookie options from configService in one place.
     */
    private getCookieOptions(): CookieOptions {
        return {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: "lax",
            maxAge: this.configService.get<number>('COOKIE_MAX_AGE', 7 * 24 * 60 * 60 * 1000),
            path: this.configService.get<string>('COOKIE_PATH', '/api/auth'),
        };
    }

    /**
     * Validates user by email and password
     */
    async validateUser(email: string, password: string): Promise<FormattedSafeUser | null> {
        // 1. Validate email format first
        if (!this.isValidEmail(email)) {
            throw new BadRequestException('Invalid email format');
        }

        // 2. Validate password is not empty
        if (!password || password.trim().length === 0) {
            throw new BadRequestException('Password is required');
        }

        // 3. Find user
        const user = await this.userService.findByEmail(email.toLowerCase().trim());

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is inactive');
        }

        // 5. Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new UnauthorizedException('Account is temporarily locked');
        }

        // 6. Validate password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            // Increment failed login attempts
            await this.handleFailedLogin(user);
            return null;
        }

        // 7. Reset failed login attempts and update last login (single query)
        await this.userService.update(user.id, {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date()
        });

        const { passwordHash, ...safeUser } = user;
        return safeUser;
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private async handleFailedLogin(user: FormattedUser): Promise<void> {
        const attempts = (user.failedLoginAttempts || 0) + 1;

        const lockDuration = 15 * 60 * 1000; // 15 minutes
        const maxAttempts = 5;

        if (attempts >= maxAttempts) {
            await this.userService.update(user.id, {
                failedLoginAttempts: attempts,
                lockedUntil: new Date(Date.now() + lockDuration)
            });
        } else {
            await this.userService.update(user.id, {
                failedLoginAttempts: attempts
            });
        }
    }

    /**
     * Validates user by ID only (for access token validation)
     */
    async validateUserById(userId: string): Promise<FormattedSafeUser | null> {
        const user = await this.userService.findById(userId);

        if (!user) {
            return null;
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is inactive');
        }

        return user;
    }

    async register(
        registerDto: RegisterDto,
        res: Response,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<AuthResult> {
        // Validate email format
        if (!this.isValidEmail(registerDto.email)) {
            throw new BadRequestException('Invalid email format');
        }

        // Check if user already exists
        const existingUser = await this.userService.findByEmail(registerDto.email.toLowerCase().trim());
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Find the default 'USER' role
        const defaultRole = await this.prisma.role.findUnique({
            where: { name: 'USER' },
        });

        if (!defaultRole) {
            throw new BadRequestException('Default role not found');
        }

        console.log(defaultRole);

        // Hash password
        const passwordHash = await bcrypt.hash(registerDto.password, 10);

        // Create user with default role
        const user = await this.prisma.user.create({
            data: {
                email: registerDto.email.toLowerCase().trim(),
                passwordHash: passwordHash,
                userRoles: {
                    create: {
                        roleId: defaultRole.id,
                    },
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

        // Transform user to safe format
        const { passwordHash: _, ...safeUser } = user;
        const formattedUser: FormattedSafeUser = {
            ...safeUser,
            roles: user.userRoles.map(ur => ur.role),
        };

        // Generate tokens and create session
        const authResult = await this.generateTokens(formattedUser, ipAddress, userAgent);

        res.cookie(refreshTokenCookieKey, authResult.refreshToken, this.getCookieOptions());

        return authResult;
    }

    async login(
        loginDto: LoginDto,
        res: Response,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<AuthResult> {
        const user = await this.validateUser(loginDto.email, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const authResult = await this.generateTokens(user, ipAddress, userAgent);

        res.cookie(refreshTokenCookieKey, authResult.refreshToken, this.getCookieOptions());

        return authResult;
    }

    async refreshToken(
        refreshToken: string,
        res: Response,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<AuthResult> {
        // Hash the refresh token to find the session
        const tokenHash = this.hashToken(refreshToken);
        const session = await this.sessionService.findByRefreshTokenHash(tokenHash);

        if (!session) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Check if session exists and is revoked (reuse detection)
        if (session.isRevoked) {
            // This could indicate token theft - revoke all sessions for this user
            await this.sessionService.revokeAllUserSessions(session.userId);
            throw new UnauthorizedException(
                'Token reuse detected. All sessions have been revoked for security.'
            );
        }

        if (session.expiresAt < new Date()) {
            throw new UnauthorizedException('Refresh token expired');
        }

        if (!session.user.isActive) {
            throw new UnauthorizedException('Account is inactive');
        }

        // Verify the JWT itself is valid and not tampered with
        try {
            this.jwtService.verify(refreshToken);
        } catch (error) {
            await this.sessionService.revokeSession(session!.id);
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Additional security: check if IP or user agent changed significantly
        // if (this.shouldFlagSuspiciousActivity(session!, ipAddress, userAgent)) {
        // Optional: require re-authentication or send security alert
        // For now, we'll allow it but could add stricter policies
        // TODO: Implement notification service
        // await this.notificationService.sendSecurityAlert(session.userId, {
        //     type: 'suspicious_activity',
        //     ipAddress,
        //     userAgent,
        // });
        // }

        // Revoke old session (refresh token rotation)
        // Combine revocation and token generation in a transaction
        const authResult = await this.prisma.$transaction(async (tx) => {
            await this.sessionService.revokeSession(session!.id);

            // Generate new tokens (does not require db, but passes for possible audit trail)
            return this.generateTokens(
                session!.user,
                ipAddress,
                userAgent,
                session!.id // Pass old session ID for audit trail
            );
        });

        res.cookie(refreshTokenCookieKey, authResult.refreshToken, this.getCookieOptions());

        return authResult;
    }

    async logout(refreshToken: string, res: Response): Promise<void> {
        if (refreshToken) {
            const tokenHash = this.hashToken(refreshToken);
            const session = await this.sessionService.findByRefreshTokenHash(tokenHash);

            if (session) {
                await this.sessionService.revokeSession(session.id);
            }
        }

        res.clearCookie(refreshTokenCookieKey, this.getCookieOptions());
    }

    /**
     * Logout from all devices
     */
    async logoutAll(userId: string, res: Response): Promise<void> {
        await this.sessionService.revokeAllUserSessions(userId);
        res.clearCookie(refreshTokenCookieKey, this.getCookieOptions());
    }

    /**
     * Generate access and refresh tokens
     */
    private async generateTokens(
        user: FormattedSafeUser,
        ipAddress?: string,
        userAgent?: string,
        previousSessionId?: number,
    ): Promise<AuthResult> {
        const payload = {
            sub: user.id,
            role: user.roles.map(role => { return role.name })
        };

        // Generate stateless access token (NOT stored in DB)
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: `${this.configService.get("JWT_ACCESS_EXPIRY_MINS", 15)}m`
        });

        // Generate refresh token with session identifier
        const sessionId = crypto.randomUUID();
        const refreshPayload = {
            ...payload,
            sessionId, // Tie token to a specific session
            type: 'refresh',
        };

        const refreshToken = this.jwtService.sign(refreshPayload, {
            expiresIn: `${this.configService.get("JWT_REFRESH_EXPIRY_DAYS", 7)}d`
        });

        // Hash the refresh token before storing
        const refreshTokenHash = this.hashToken(refreshToken);

        // Store session with hashed refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.sessionService.create({
            userId: user.id,
            sessionId: sessionId,
            refreshTokenHash: refreshTokenHash,
            ipAddress: ipAddress,
            userAgent: userAgent,
            expiresAt: expiresAt,
            previousSessionId: previousSessionId, // For audit trail
        });

        return {
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: user
        };
    }

    /**
     * Hash a token using SHA-256
     */
    private hashToken(token: string): string {
        return crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
    }

    /**
     * Check if the request shows suspicious activity
     */
    private shouldFlagSuspiciousActivity(
        session: SafeSession,
        ipAddress?: string,
        userAgent?: string,
    ): boolean {
        // Flag if IP address changed (could be VPN/travel, so don't block)
        const ipChanged: boolean = !!(session.ipAddress && ipAddress && session.ipAddress !== ipAddress);

        // Flag if user agent changed significantly
        const userAgentChanged: boolean = !!(
            session.userAgent &&
            userAgent &&
            !this.areUserAgentsSimilar(session.userAgent, userAgent)
        );

        return ipChanged || userAgentChanged;
    }

    /**
     * Compare user agents to detect device changes
     */
    private areUserAgentsSimilar(ua1: string, ua2: string): boolean {
        // Simple comparison - extract browser and OS
        // In production, use a library like ua-parser-js
        const extract = (ua: string) => {
            const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)/)?.[0] || '';
            const os = ua.match(/(Windows|Mac|Linux|Android|iOS)/)?.[0] || '';
            return `${browser}-${os}`;
        };

        return extract(ua1) === extract(ua2);
    }

    /**
     * Revoke a specific session by ID
     */
    async revokeSession(userId: string, sessionId: number): Promise<void> {
        const session = await this.sessionService.findById(sessionId);

        if (!session || session.userId !== userId) {
            throw new UnauthorizedException('Session not found');
        }

        await this.sessionService.revokeSession(sessionId);
    }

    async requestPasswordReset(email: string): Promise<void> {
        const user = await this.userService.findByEmail(email);

        if (!user) {
            // Don't reveal if user exists
            return;
        }

        // Generate reset token (store in DB with expiry)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = this.hashToken(resetToken);
        const resetTokenExpiry = new Date();
        resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetTokenHash,
                passwordResetExpiry: resetTokenExpiry,
            },
        });

        // TODO: Send email with reset link
        // await this.emailService.sendPasswordResetEmail(email, resetToken);
    }

    /**
     * Reset password using token
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        const tokenHash = this.hashToken(token);

        const user = await this.prisma.user.findFirst({
            where: {
                passwordResetToken: tokenHash,
                passwordResetExpiry: { gt: new Date() },
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid or expired reset token');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                passwordResetToken: null,
                passwordResetExpiry: null,
                passwordChangedAt: new Date(),
            },
        });

        // Revoke all existing sessions for security
        await this.sessionService.revokeAllUserSessions(user.id);
    }
}