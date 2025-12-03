import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule'; // ADD THIS
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { SessionModule } from 'src/session/session.module';
import { UserService } from 'src/user/user.service';
import { SessionService } from 'src/session/session.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { SessionCleanupTask } from './tasks/session-cleanup.task'; // ADD THIS
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    SessionModule,
    ScheduleModule.forRoot(), // ADD THIS
    JwtModule.registerAsync({
      imports: [ConfigModule,
        ThrottlerModule.forRoot([{
          ttl: 60000, // 1 minute
          limit: 10, // 10 requests per minute
        }]),
        ScheduleModule.forRoot()],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          issuer: 'labyrinth-nexus',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, OAuthController],
  providers: [
    AuthService,
    OAuthService,
    JwtStrategy,
    GoogleStrategy,
    PrismaService,
    UserService,
    SessionService,
    SessionCleanupTask, // ADD THIS
  ],
  exports: [AuthService, OAuthService],
})
export class AuthModule { }