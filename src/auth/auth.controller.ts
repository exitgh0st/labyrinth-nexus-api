import {
    Controller,
    Post,
    Body,
    Req,
    Res,
    UseGuards,
    Get,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
    Param,
    ParseIntPipe,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { SafeUser } from 'src/user/user.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @Public()
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
        const { refresh_token, ...publicResult } = result;

        return publicResult;
    }

    @Post('refresh')
    @Public()
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const refreshToken = req.cookies?.refresh_token;

        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not found');
        }

        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.get('user-agent');

        const result = await this.authService.refreshToken(
            refreshToken,
            res,
            ipAddress,
            userAgent,
        );

        // Don't send refresh token in response body
        const { refresh_token, ...publicResult } = result;

        return publicResult;
    }

    @Post('logout')
    @Public()
    @HttpCode(HttpStatus.OK)
    async logout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const refreshToken = req.cookies?.refresh_token;
        
        await this.authService.logout(refreshToken, res);

        return { message: 'Logged out successfully' };
    }

    @Post('logout-all')
    @HttpCode(HttpStatus.OK)
    async logoutAll(
        @CurrentUser() user: SafeUser,
        @Res({ passthrough: true }) res: Response,
    ) {
        await this.authService.logoutAll(user.id, res);

        return { message: 'Logged out from all devices' };
    }

    @Post(':id/revoke')
    @HttpCode(HttpStatus.OK)
    async revokeSession(
        @CurrentUser() user: SafeUser,
        @Param('id', ParseIntPipe) sessionId: number,
    ) {
        await this.authService.revokeSession(user.id, sessionId);

        return { message: 'Session revoked successfully' };
    }

    @Get('me')
    async getCurrentUser(@CurrentUser() user: SafeUser) {
        return user;
    }
}