import { Prisma } from "generated/prisma";

export const userSelect = {
    id: true,
    email: true,
    password_hash: true,
    email_verified: true,
    email_verified_at: true,
    first_name: true,
    last_name: true,
    display_name: true,
    avatar_url: true,
    is_active: true,
    is_deleted: true,
    deleted_at: true,
    last_login_at: true,
    failed_login_attempts: true,
    locked_until: true,
    password_changed_at: true,
    created_at: true,
    updated_at: true,
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