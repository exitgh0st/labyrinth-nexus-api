import { Prisma } from "generated/prisma";
import { safeUserSelect } from "src/user/selects/safe-user-select";

export const safeSessionSelect = {
    id: true,
    userId: true,
    sessionId: true,
    refreshTokenHash: false,
    ipAddress: true,
    userAgent: true,
    expiresAt: true,
    createdAt: true,
    lastUsedAt: true,
    isRevoked: true,
    previousSessionId: true,
    updatedAt: true,
    user: {
        select: safeUserSelect
    },
} satisfies Prisma.SessionSelect;