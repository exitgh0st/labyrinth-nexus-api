// src/auth/oauth.controller.ts
import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { GoogleOAuthGuard } from './guards/oauth.guard';
import { OAuthService } from './oauth.service';
import { Public } from './decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from './decorators/current-user.decorator';
import type { FormattedSafeUser } from 'src/user/utils/transform-user.util';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth/oauth')
export class OAuthController {
  constructor(
    private oauthService: OAuthService,
    private configService: ConfigService,
  ) {}

  // Google OAuth Routes
  @Get('google')
  @Public()
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {
    // Initiates the Google OAuth flow
  }

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleOAuthGuard)
  async googleAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const profile = req.user as any;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const authResult = await this.oauthService.handleOAuthLogin(
        profile,
        res,
        ipAddress,
        userAgent,
      );

      // Set refresh token cookie
      res.cookie('refreshToken', authResult.refreshToken, {
        httpOnly: true,
        secure: this.configService.get('NODE_ENV') === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth',
      });

      // Redirect to frontend with access token
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const redirectUrl = `${frontendUrl}/auth/callback?token=${authResult.accessToken}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      // Redirect to frontend with error
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const errorMessage = encodeURIComponent(error.message || 'Authentication failed');
      res.redirect(`${frontendUrl}/auth/error?message=${errorMessage}`);
    }
  }

  // Link Google account to existing user (requires authentication)
  @Post('link/google')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'USER')
  async linkAccount(
    @CurrentUser() user: FormattedSafeUser,
    @Body() body: { profile: any },
  ) {
    await this.oauthService.linkOAuthAccount(
      user.id,
      body.profile,
    );

    return { message: 'Google account linked successfully' };
  }

  // Unlink Google account (requires authentication)
  @Delete('unlink/google')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'USER')
  async unlinkAccount(
    @CurrentUser() user: FormattedSafeUser,
  ) {
    await this.oauthService.unlinkOAuthAccount(user.id);

    return { message: 'Google account unlinked successfully' };
  }
}