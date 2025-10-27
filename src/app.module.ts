import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SessionModule } from './session/session.module';
import { PrismaService } from './shared/services/prisma.service';
import { ConfigModule } from '@nestjs/config';

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
    PrismaService
  ],
})
export class AppModule {}
