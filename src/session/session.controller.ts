import {
    Controller,
    Get,
    Delete,
    Param,
    Query,
    ParseIntPipe,
    UseGuards,
    HttpCode,
    HttpStatus,
    Patch,
  } from '@nestjs/common';
  import { SessionService } from './session.service';
  import { FindAllSessionsDto } from './dto/find-all-sessions.dto';
  import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
  import { RolesGuard } from 'src/auth/guards/roles.guard';
  import { Roles } from 'src/auth/decorators/roles.decorator';
  
  @Controller('sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN') // Only admins can manage sessions
  export class SessionController {
    constructor(private readonly sessionService: SessionService) {}
  
    @Get()
    findAll(@Query() query: FindAllSessionsDto) {
      return this.sessionService.findAll(query);
    }
  
    @Patch(':id/revoke')
    revokeSession(@Param('id', ParseIntPipe) id: number) {
      return this.sessionService.revokeSession(id);
    }
  
    @Patch('user/:userId/revoke-all')
    revokeAllUserSessions(@Param('userId') userId: string) {
      return this.sessionService.revokeAllUserSessions(userId);
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteSession(@Param('id', ParseIntPipe) id: number) {
      return this.sessionService.deleteSession(id);
    }
  
    @Delete('cleanup/expired')
    @HttpCode(HttpStatus.OK)
    cleanupExpiredSessions() {
      return this.sessionService.cleanupExpiredSessions();
    }
  
    @Delete('cleanup/revoked')
    @HttpCode(HttpStatus.OK)
    cleanupRevokedSessions(@Query('days', ParseIntPipe) days: number = 30) {
      return this.sessionService.cleanupRevokedSessions(days);
    }
  }