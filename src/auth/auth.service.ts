import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SafeSession, SessionService } from 'src/session/session.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { SafeUser, UserService } from 'src/user/user.service';
import type { Response, CookieOptions } from 'express';
import { AuthResult } from './interfaces/auth-result.interface';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private userService: UserService,
        private sessionService: SessionService,
        private configService: ConfigService,
    ) { }

    /**
     * Helper to get cookie options from configService in one place.
     */
    private getCookieOptions(): CookieOptions {
        return {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: "strict",
            maxAge: this.configService.get<number>('COOKIE_MAX_AGE', 7 * 24 * 60 * 60 * 1000),
            path: this.configService.get<string>('COOKIE_PATH', '/auth'),
        };
    }

    /**
     * Validates user by username and password
     */
    async validateUser(username: string, password: string): Promise<SafeUser | null> {
        const user = await this.userService.findByUsername(username);

        if (!user) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return null;
        }

        if (!user.is_active) {
            throw new UnauthorizedException('Account is inactive');
        }

        const { password_hash, ...userWithoutPasswordHash } = user;

        return userWithoutPasswordHash;
    }

    /**
     * Validates user by ID only (for access token validation)
     */
    async validateUserById(userId: number): Promise<SafeUser | null> {
        const user = await this.userService.findById(userId);

        if (!user) {
            return null;
        }

        if (!user.is_active) {
            throw new UnauthorizedException('Account is inactive');
        }

        return user;
    }

    async login(
        loginDto: LoginDto,
        res: Response,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<AuthResult> {
        const user = await this.validateUser(loginDto.username, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const authResult = await this.generateTokens(user, ipAddress, userAgent);

        res.cookie('refresh_token', authResult.refresh_token, this.getCookieOptions());

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
        if (session.is_revoked) {
            // This could indicate token theft - revoke all sessions for this user
            await this.sessionService.revokeAllUserSessions(session.user_id);
            throw new UnauthorizedException(
                'Token reuse detected. All sessions have been revoked for security.'
            );
        }

        if (session.expires_at < new Date()) {
            throw new UnauthorizedException('Refresh token expired');
        }

        if (!session.user.is_active) {
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
        if (this.shouldFlagSuspiciousActivity(session!, ipAddress, userAgent)) {
            // Optional: require re-authentication or send security alert
            // For now, we'll allow it but could add stricter policies
            // TODO: Implement notification service
            // await this.notificationService.sendSecurityAlert(session.user_id, {
            //     type: 'suspicious_activity',
            //     ipAddress,
            //     userAgent,
            // });
        }

        // Revoke old session (refresh token rotation)
        await this.sessionService.revokeSession(session!.id);

        // Generate new tokens
        const authResult = await this.generateTokens(
            session!.user,
            ipAddress,
            userAgent,
            session!.id // Pass old session ID for audit trail
        );

        res.cookie('refresh_token', authResult.refresh_token, this.getCookieOptions());

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

        res.clearCookie('refresh_token', this.getCookieOptions());
    }

    /**
     * Logout from all devices
     */
    async logoutAll(userId: number, res: Response): Promise<void> {
        await this.sessionService.revokeAllUserSessions(userId);
        res.clearCookie('refresh_token', this.getCookieOptions());
    }

    /**
     * Generate access and refresh tokens
     */
    private async generateTokens(
        user: SafeUser,
        ipAddress?: string,
        userAgent?: string,
        previousSessionId?: number,
    ): Promise<AuthResult> {
        const payload = {
            sub: user.id,
            username: user.username,
            role: user.role,
        };

        // Generate stateless access token (NOT stored in DB)
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get("JWT_ACCESS_EXPIRY", "15m")
        });

        // Generate refresh token with session identifier
        const sessionId = crypto.randomUUID();
        const refreshPayload = {
            ...payload,
            sessionId, // Tie token to a specific session
            type: 'refresh',
        };

        const refreshToken = this.jwtService.sign(refreshPayload, {
            expiresIn: this.configService.get("JWT_REFRESH_EXPIRY", "7d")
        });

        // Hash the refresh token before storing
        const refreshTokenHash = this.hashToken(refreshToken);

        // Store session with hashed refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.sessionService.create({
            user_id: user.id,
            session_id: sessionId,
            refresh_token_hash: refreshTokenHash,
            ip_address: ipAddress,
            user_agent: userAgent,
            expires_at: expiresAt,
            previous_session_id: previousSessionId, // For audit trail
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: 'Bearer',
            expires_in: this.configService.get("JWT_ACCESS_EXPIRY_IN_SECS", 900), // 15 minutes in seconds
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
        const ipChanged: boolean = !!(session.ip_address && ipAddress && session.ip_address !== ipAddress);

        // Flag if user agent changed significantly
        const userAgentChanged: boolean = !!(
            session.user_agent &&
            userAgent &&
            !this.areUserAgentsSimilar(session.user_agent, userAgent)
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
    async revokeSession(userId: number, sessionId: number): Promise<void> {
        const session = await this.sessionService.findById(sessionId);
        
        if (!session || session.user_id !== userId) {
            throw new UnauthorizedException('Session not found');
        }

        await this.sessionService.revokeSession(sessionId);
    }
}