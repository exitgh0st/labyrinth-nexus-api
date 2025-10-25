import {
    Injectable,
    Res,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SafeSession, SessionService } from 'src/session/session.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SafeUser, UserService } from 'src/user/user.service';
import type { Response } from 'express';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private userService: UserService,
        private sessionService: SessionService,
    ) { }

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

    async login(
        loginDto: LoginDto,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<AuthResponseDto> {
        const user = await this.validateUser(loginDto.username, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateTokens(user, ipAddress, userAgent);
    }

    async refreshToken(
        refreshToken: string,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<AuthResponseDto> {
        const session = await this.sessionService.findByRefreshToken(refreshToken);

        const validationException = this.validateSession(session);

        if (validationException) {
            throw validationException;
        }

        // Revoke old session
        await this.sessionService.revokeSession(session!.id);

        // Generate new tokens
        return this.generateTokens(session!.user, ipAddress, userAgent);
    }

    async logout(token: string, @Res({ passthrough: true }) res: Response): Promise<void> {
        const session = await this.sessionService.findByToken(token);

        if (session) {
            await this.sessionService.revokeSession(session.id);
        }

        // Clear refresh token cookie
        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/auth/refresh',
        });
    }

    async validateToken(token: string): Promise<SafeUser | null> {
        const session = await this.sessionService.findByToken(token);

        const validationException = this.validateSession(session);

        if (validationException) {
            throw validationException;
        }

        // Update last used timestamp
        await this.sessionService.updateLastUsed(session!.id);

        return session!.user;
    }

    private validateSession(session: SafeSession | null): UnauthorizedException | null {
        if (!session) {
            return new UnauthorizedException('Invalid refresh token');
        }

        if (session.is_revoked) {
            return new UnauthorizedException('Session has been revoked');
        }

        if (session.expires_at < new Date()) {
            return new UnauthorizedException('Refresh token expired');
        }

        if (!session.user.is_active) {
            return new UnauthorizedException('Account is inactive');
        }

        return null;
    }

    private async generateTokens(
        user: SafeUser,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<AuthResponseDto> {
        const payload = {
            sub: user.id,
            username: user.username,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '15m', // Short-lived access token
        });

        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: '7d', // Longer-lived refresh token
        });

        // Store session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await this.sessionService.create({
            user_id: user.id,
            token: accessToken,
            refresh_token: refreshToken,
            ip_address: ipAddress,
            user_agent: userAgent,
            expires_at: expiresAt,
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: 'Bearer',
            expires_in: 900, // 15 minutes in seconds
        };
    }
}