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

    async findAll(params?: FindAllSessionsDto): Promise<{ data: SafeSession[]; total: number }> {
        const { skip = 0, take = 10, userId, isRevoked, includeExpired } = params || {};

        // use camelCase keys for Prisma fields
        const where: Prisma.SessionWhereInput = {
            ...(userId && { userId }),
            ...(isRevoked !== undefined && { isRevoked }),
            ...(!includeExpired && {
                expiresAt: { gte: new Date() },
            }),
        };


        const [sessions, total] = await Promise.all([
            this.prisma.session.findMany({
                skip,
                ...(take > 0 && { take }), // Only apply take if > 0, otherwise return all
                where,
                select: safeSessionSelect,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.session.count({ where }),
        ]);

        const data = sessions.map(session => this.transformSession(session));

        return { data, total };
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
        const session = await this.prisma.session.findUnique({
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

    async revokeSession(id: number): Promise<SafeSession> {
        const session = await this.prisma.session.update({
            where: { id },
            data: {
                isRevoked: true,
                updatedAt: new Date(),
            },
            select: safeSessionSelect,
        });

        return this.transformSession(session);
    }

    async revokeAllUserSessions(userId: string): Promise<{ count: number }> {
        const result = await this.prisma.session.updateMany({
            where: { userId: userId, isRevoked: false },
            data: {
                isRevoked: true,
                updatedAt: new Date(),
            },
        });

        return { count: result.count };
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
    async cleanupExpiredSessions(): Promise<{ count: number }> {
        const now = new Date();
        const result = await this.prisma.session.deleteMany({
            where: { expiresAt: { lt: now } },
        });
        return { count: result.count };
    }

    /**
     * Clean up old revoked sessions (run as a cron job)
     */
    async cleanupRevokedSessions(daysOld: number): Promise<{ count: number }> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await this.prisma.session.deleteMany({
            where: {
                isRevoked: true,
                updatedAt: { lt: cutoffDate },
            },
        });
        return { count: result.count };
    }
}