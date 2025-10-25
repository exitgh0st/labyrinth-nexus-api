import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { HttpBearerStrategy } from './strategies/http-bearer.strategy';
import { PrismaService } from 'src/prisma.service';
import { SessionModule } from 'src/session/session.module';
import { UserService } from 'src/user/user.service';
import { SessionService } from 'src/session/session.service';

@Module({
  imports: [
    PassportModule,
    SessionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          issuer: 'labyrinth-nexus',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, HttpBearerStrategy, PrismaService, UserService, SessionService],
  exports: [AuthService],
})
export class AuthModule {}