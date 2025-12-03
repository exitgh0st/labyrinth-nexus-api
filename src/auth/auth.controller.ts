import {
    Controller,
    Post,
    Body,
    Req,
    Res,
    Get,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
    Param,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import type { FormattedSafeUser } from 'src/user/utils/transform-user.util';
import { Throttle } from '@nestjs/throttler';
import { SessionService } from 'src/session/session.service';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private sessionService: SessionService) { }

    @Post('register')
    @Public()
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 registrations per minute
    @HttpCode(HttpStatus.CREATED)
    async register(
        @Body() registerDto: RegisterDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.get('user-agent');

        const result = await this.authService.register(
            registerDto,
            res,
            ipAddress,
            userAgent,
        );

        // Don't send refresh token in response body (it's in httpOnly cookie)
        const { refreshToken, ...publicResult } = result;

        return publicResult;
    }

    @Post('login')
    @Public()
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() loginDto: LoginDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.get('user-agent');

        const result = await this.authService.login(
            loginDto,
            res,
            ipAddress,
            userAgent,
        );

        // Don't send refresh token in response body (it's in httpOnly cookie)
        const { refreshToken, ...publicResult } = result;

        return publicResult;
    }

    @Post('refresh')
    @Public()
    @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 refreshes per minute
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const refreshTokenFromCookies = req.cookies?.refreshToken;
        if (!refreshTokenFromCookies) {
            throw new UnauthorizedException('Refresh token not found');
        }

        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.get('user-agent');

        const result = await this.authService.refreshToken(
            refreshTokenFromCookies,
            res,
            ipAddress,
            userAgent,
        );

        // Don't send refresh token in response body
        const { refreshToken, ...publicResult } = result;

        return publicResult;
    }

    @Post('logout')
    @Public()
    @HttpCode(HttpStatus.OK)
    async logout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const refreshToken = req.cookies?.refreshToken;

        await this.authService.logout(refreshToken, res);

        return { message: 'Logged out successfully' };
    }

    @Post('logout-all')
    @HttpCode(HttpStatus.OK)
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'USER')
    async logoutAll(
        @CurrentUser() user: FormattedSafeUser,
        @Res({ passthrough: true }) res: Response,
    ) {
        await this.authService.logoutAll(user.id, res);

        return { message: 'Logged out from all devices' };
    }

    @Post(':id/revoke')
    @HttpCode(HttpStatus.OK)
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'USER')
    async revokeSession(
        @CurrentUser() user: FormattedSafeUser,
        @Param('id', ParseIntPipe) sessionId: number,
    ) {
        await this.authService.revokeSession(user.id, sessionId);

        return { message: 'Session revoked successfully' };
    }

    @Get('me')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'USER')
    async getCurrentUser(@CurrentUser() user: FormattedSafeUser) {
        return user;
    }

    @Get('sessions')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'USER')
    async getActiveSessions(@CurrentUser() user: FormattedSafeUser) {
        return this.sessionService.findActiveByUserId(user.id);
    }
}