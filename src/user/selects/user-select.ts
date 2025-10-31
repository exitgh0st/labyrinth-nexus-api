import { Prisma } from "generated/prisma";

export const userSelect = {
    id: true,
    email: true,
    passwordHash: true,
    emailVerified: true,
    emailVerifiedAt: true,
    firstName: true,
    lastName: true,
    displayName: true,
    avatarUrl: true,
    isActive: true,
    isDeleted: true,
    deletedAt: true,
    lastLoginAt: true,
    failedLoginAttempts: true,
    lockedUntil: true,
    passwordChangedAt: true,
    createdAt: true,
    updatedAt: true,
    userRoles: {
        select: {
            role: {
                select: {
                    name: true
                }
            }
        }
    }
} satisfies Prisma.UserSelect;