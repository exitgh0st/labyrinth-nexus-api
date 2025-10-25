import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [SessionController],
  providers: [PrismaService, SessionService]
})
export class SessionModule {}
