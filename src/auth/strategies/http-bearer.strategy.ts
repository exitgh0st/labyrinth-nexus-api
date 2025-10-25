import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { AuthService } from '../auth.service';
import { SafeUser } from 'src/user/user.service';

@Injectable()
export class HttpBearerStrategy extends PassportStrategy(Strategy, 'bearer') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(token: string): Promise<SafeUser> {
    const user = await this.authService.validateToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return user;
  }
}