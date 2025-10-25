import { Prisma } from "generated/prisma";

export const safeUserSelect = {
    id: true,
    username: true,
    role: true,
    is_active: true,
    created_at: true,
    updated_at: true,
    password_hash: false, // explicitly exclude
} satisfies Prisma.UserSelect;