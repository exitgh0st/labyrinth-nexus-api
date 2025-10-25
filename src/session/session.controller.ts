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
  import { BearerAuthGuard } from 'src/auth/guards/bearer-auth.guard';
  import { RolesGuard } from 'src/auth/guards/roles.guard';
  import { Roles } from 'src/auth/decorators/roles.decorator';
  
  @Controller('sessions')
  @UseGuards(BearerAuthGuard, RolesGuard)
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
    revokeAllUserSessions(@Param('userId', ParseIntPipe) userId: number) {
      return this.sessionService.revokeAllUserSessions(userId);
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteSession(@Param('id', ParseIntPipe) id: number) {
      return this.sessionService.deleteSession(id);
    }
  
    @Delete('cleanup/expired')
    @HttpCode(HttpStatus.OK)
    deleteExpiredSessions() {
      return this.sessionService.deleteExpiredSessions();
    }
  
    @Delete('cleanup/revoked')
    @HttpCode(HttpStatus.OK)
    deleteRevokedSessions(@Query('days', ParseIntPipe) days: number = 30) {
      return this.sessionService.deleteRevokedSessions(days);
    }
  }