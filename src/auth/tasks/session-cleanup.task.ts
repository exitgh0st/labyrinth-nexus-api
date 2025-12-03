import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionService } from 'src/session/session.service';

@Injectable()
export class SessionCleanupTask {
  private readonly logger = new Logger(SessionCleanupTask.name);

  constructor(private sessionService: SessionService) {}

  // Run every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredSessions() {
    this.logger.log('Starting expired sessions cleanup...');
    
    try {
      const deletedCount = await this.sessionService.cleanupExpiredSessions();
      this.logger.log(`Cleaned up ${deletedCount} expired sessions`);
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions', error);
    }
  }

  // Run every week
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldRevokedSessions() {
    this.logger.log('Starting old revoked sessions cleanup...');
    
    try {
      const deletedCount = await this.sessionService.cleanupRevokedSessions(30); // 30 days old
      this.logger.log(`Cleaned up ${deletedCount} old revoked sessions`);
    } catch (error) {
      this.logger.error('Failed to cleanup old revoked sessions', error);
    }
  }
}