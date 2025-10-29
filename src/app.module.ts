import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SessionModule } from './session/session.module';
import { PrismaService } from './shared/services/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere
      envFilePath: ['.env.development.local'], // Load multiple env files
      cache: true, // Cache environment variables for performance
    }),
    AuthModule, UserModule, SessionModule],
  controllers: [AppController],
  providers: [AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Apply bearer auth globally
    }
  ],
})
export class AppModule {}
