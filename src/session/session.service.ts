import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { Prisma } from 'generated/prisma';
import { CreateSessionDto } from './dto/create-session.dto';
import { FindAllSessionsDto } from './dto/find-all-sessions.dto';
import { safeSessionSelect } from './selects/safe-session.select';

export type SafeSession = Prisma.SessionGetPayload<{
    select: typeof safeSessionSelect;
}>;

@Injectable()
export class SessionService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateSessionDto): Promise<SafeSession> {
        return this.prisma.session.create({
            data,
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

    async findByToken(token: string): Promise<SafeSession | null> {
        return this.prisma.session.findUnique({
            where: { token },
            select: safeSessionSelect
        });
    }

    async findByRefreshToken(refreshToken: string): Promise<SafeSession | null> {
        return this.prisma.session.findUnique({
            where: { refresh_token: refreshToken },
            select: safeSessionSelect
        });
    }

    async updateLastUsed(id: number): Promise<void> {
        await this.prisma.session.update({
            where: { id },
            data: { last_used_at: new Date() }
        });
    }

    async revokeSession(id: number): Promise<SafeSession> {
        return this.prisma.session.update({
            where: { id },
            data: { is_revoked: true },
            select: safeSessionSelect,
        });
    }

    async revokeAllUserSessions(userId: number): Promise<number> {
        const result = await this.prisma.session.updateMany({
            where: {
                user_id: userId,
                is_revoked: false,
            },
            data: { is_revoked: true },
        });
        return result.count;
    }

    async deleteSession(id: number): Promise<SafeSession> {
        return this.prisma.session.delete({
            where: { id },
            select: safeSessionSelect,
        });
    }

    async deleteExpiredSessions(): Promise<number> {
        const result = await this.prisma.session.deleteMany({
            where: {
                expires_at: { lt: new Date() },
            },
        });
        return result.count;
    }

    async deleteRevokedSessions(olderThanDays: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const result = await this.prisma.session.deleteMany({
            where: {
                is_revoked: true,
                created_at: { lt: cutoffDate },
            },
        });
        return result.count;
    }
}