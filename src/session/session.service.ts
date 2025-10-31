import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { Prisma } from 'generated/prisma';
import { CreateSessionDto } from './dto/create-session.dto';
import { safeSessionSelect } from './selects/safe-session.select';
import { FindAllSessionsDto } from './dto/find-all-sessions.dto';

export type SafeSession = Prisma.SessionGetPayload<{
    select: typeof safeSessionSelect;
}>;

@Injectable()
export class SessionService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async create(dto: CreateSessionDto): Promise<SafeSession> {
        return this.prisma.session.create({
            data: dto,
            select: safeSessionSelect
        });
    }

    async findAll(params?: FindAllSessionsDto): Promise<SafeSession[]> {
        const { skip = 0, take = 10, user_id, is_revoked, include_expired } = params || {};

        const where: Prisma.SessionWhereInput = {
            ...(user_id && { user_id }),
            ...(is_revoked !== undefined && { is_revoked }),
            ...(!include_expired && {
                expires_at: { gte: new Date() },
            }),
        };

        return this.prisma.session.findMany({
            skip,
            take,
            where,
            select: safeSessionSelect,
            orderBy: { created_at: 'desc' },
        });
    }

    async findById(id: number): Promise<SafeSession | null> {
        const session = await this.prisma.session.findUnique({
            where: { id },
            select: safeSessionSelect,
        });
        return session;
    }

    async findByRefreshTokenHash(tokenHash: string): Promise<SafeSession | null> {
        const session = await this.prisma.session.findFirst({
            where: { refresh_token_hash: tokenHash },
            select: safeSessionSelect,
        });
        return session;
    }

    async findBySessionId(sessionId: string): Promise<SafeSession | null> {
        const session = await this.prisma.session.findFirst({
            where: { session_id: sessionId },
            select: safeSessionSelect,
        });
        return session;
    }

    async findActiveByUserId(userId: string): Promise<SafeSession[]> {
        const now = new Date();
        const sessions = await this.prisma.session.findMany({
            where: {
                user_id: userId,
                is_revoked: false,
                expires_at: { gt: now },
            },
            select: safeSessionSelect,
            orderBy: { created_at: 'desc' },
        });
        return sessions;
    }

    async revokeSession(sessionId: number): Promise<void> {
        await this.prisma.session.update({
            where: { id: sessionId },
            data: {
                is_revoked: true,
                updated_at: new Date(),
            },
        });
    }

    async revokeAllUserSessions(userId: string): Promise<void> {
        await this.prisma.session.updateMany({
            where: { user_id: userId, is_revoked: false },
            data: {
                is_revoked: true,
                updated_at: new Date(),
            },
        });
    }

    async updateLastUsed(sessionId: number): Promise<void> {
        await this.prisma.session.update({
            where: { id: sessionId },
            data: {
                last_used_at: new Date(),
            },
        });
    }

    async deleteSession(sessionId: number): Promise<void> {
        await this.prisma.session.delete({
            where: { id: sessionId },
        });
    }

    /**
     * Clean up expired sessions (run as a cron job)
     */
    async cleanupExpiredSessions(): Promise<number> {
        const now = new Date();
        const result = await this.prisma.session.deleteMany({
            where: { expires_at: { lt: now } },
        });
        return result.count;
    }

    /**
     * Clean up old revoked sessions (run as a cron job)
     */
    async cleanupRevokedSessions(daysOld: number): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await this.prisma.session.deleteMany({
            where: {
                is_revoked: true,
                updated_at: { lt: cutoffDate },
            },
        });
        return result.count;
    }
}