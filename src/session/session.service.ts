import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { Prisma, Role } from 'generated/prisma';
import { CreateSessionDto } from './dto/create-session.dto';
import { safeSessionSelect } from './selects/safe-session.select';
import { FindAllSessionsDto } from './dto/find-all-sessions.dto';
import { FormattedSafeUser, transformSafeUser } from 'src/user/utils/transform-user.util';

type RawSafeSession = Prisma.SessionGetPayload<{
    select: typeof safeSessionSelect;
}>;

export type SafeSession = Omit<RawSafeSession, 'user'> & {
    user: FormattedSafeUser
};

@Injectable()
export class SessionService {
    constructor(
        private prisma: PrismaService,
    ) { }

    transformSession(session: RawSafeSession): SafeSession {
        const { user, ...sessionWithoutUser } = session
        const safeUser = transformSafeUser(session.user);

        const safeSession: SafeSession = { user: safeUser, ...sessionWithoutUser };
        return safeSession;
    }

    async create(dto: CreateSessionDto): Promise<SafeSession> {
        const session = await this.prisma.session.create({
            data: dto,
            select: safeSessionSelect
        });

        return this.transformSession(session);
    }

    async findAll(params?: FindAllSessionsDto): Promise<SafeSession[]> {
        const { skip = 0, take = 10, userId: user_id, isRevoked: is_revoked, includeExpired: include_expired } = params || {};

        // use camelCase keys for Prisma fields
        const where: Prisma.SessionWhereInput = {
            ...(user_id && { userId: user_id }),
            ...(is_revoked !== undefined && { isRevoked: is_revoked }),
            ...(!include_expired && {
                expiresAt: { gte: new Date() },
            }),
        };

        const sessions = await this.prisma.session.findMany({
            skip,
            take,
            where,
            select: safeSessionSelect,
            orderBy: { createdAt: 'desc' },
        });

        const safeSessions = sessions.map(session => this.transformSession(session));

        return safeSessions;
    }

    async findById(id: number): Promise<SafeSession | null> {
        const session = await this.prisma.session.findUnique({
            where: { id },
            select: safeSessionSelect,
        });

        if (!session) {
            return null;
        }

        return this.transformSession(session);
    }

    async findByRefreshTokenHash(tokenHash: string): Promise<SafeSession | null> {
        const session = await this.prisma.session.findFirst({
            where: { refreshTokenHash: tokenHash },
            select: safeSessionSelect,
        });

        if (!session) {
            return null;
        }

        return this.transformSession(session);
    }

    async findBySessionId(sessionId: string): Promise<SafeSession | null> {
        const session = await this.prisma.session.findFirst({
            where: { sessionId },
            select: safeSessionSelect,
        });
        
        if (!session) {
            return null;
        }

        return this.transformSession(session);
    }

    async findActiveByUserId(userId: string): Promise<SafeSession[]> {
        const now = new Date();
        const sessions = await this.prisma.session.findMany({
            where: {
                userId,
                isRevoked: false,
                expiresAt: { gt: now },
            },
            select: safeSessionSelect,
            orderBy: { createdAt: 'desc' },
        });

        const safeSessions = sessions.map(session => this.transformSession(session));

        return safeSessions;
    }

    async revokeSession(id: number): Promise<void> {
        await this.prisma.session.update({
            where: { id },
            data: {
                isRevoked: true,
                updatedAt: new Date(),
            },
        });
    }

    async revokeAllUserSessions(userId: string): Promise<void> {
        await this.prisma.session.updateMany({
            where: { userId: userId, isRevoked: false },
            data: {
                isRevoked: true,
                updatedAt: new Date(),
            },
        });
    }

    async updateLastUsed(id: number): Promise<void> {
        await this.prisma.session.update({
            where: { id },
            data: {
                lastUsedAt: new Date(),
            },
        });
    }

    async deleteSession(id: number): Promise<void> {
        await this.prisma.session.delete({
            where: { id },
        });
    }

    /**
     * Clean up expired sessions (run as a cron job)
     */
    async cleanupExpiredSessions(): Promise<number> {
        const now = new Date();
        const result = await this.prisma.session.deleteMany({
            where: { expiresAt: { lt: now } },
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
                isRevoked: true,
                updatedAt: { lt: cutoffDate },
            },
        });
        return result.count;
    }
}