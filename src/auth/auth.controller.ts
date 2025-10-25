import {
    Controller,
    Post,
    Body,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
    Get,
    Res,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { BearerAuthGuard } from './guards/bearer-auth.guard';
import { Public } from './decorators/public.decorator';
import type { Request, Response } from 'express'; // Fixed: use 'import type' for Request
import { CurrentUser } from './decorators/current-user.decorator';
import type { SafeUser } from 'src/user/user.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() loginDto: LoginDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response
    ): Promise<AuthResponseDto> {
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        const authResponse =  await this.authService.login(loginDto, ipAddress, userAgent);

        this.setRefreshToken(res, authResponse);

        return {
            access_token: authResponse.access_token,
            token_type: authResponse.token_type,
            expires_in: authResponse.expires_in,
        };
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Body() refreshTokenDto: RefreshTokenDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response
    ): Promise<AuthResponseDto> {
        const refreshToken = req.cookies['refresh_token'];
        
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not found');
        }

        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        const authResponse = await this.authService.refreshToken(
            refreshTokenDto.refresh_token,
            ipAddress,
            userAgent,
        );

        this.setRefreshToken(res, authResponse);

        return {
            access_token: authResponse.access_token,
            token_type: authResponse.token_type,
            expires_in: authResponse.expires_in
        }
    }

    setRefreshToken(res: Response, authResponse: AuthResponseDto) {
        res.cookie('refresh_token', authResponse.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/auth/refresh',
        });
    }

    @UseGuards(BearerAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(@Req() req: Request, @Res({passthrough: true}) res: Response): Promise<void> {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            await this.authService.logout(token, res);
        }
    }

    @UseGuards(BearerAuthGuard)
    @Get('me')
    getProfile(@CurrentUser() safeUser: SafeUser) {
        return safeUser;
    }
}