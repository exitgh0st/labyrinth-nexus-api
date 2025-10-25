import { Prisma } from "generated/prisma";
import { safeUserSelect } from "src/user/selects/safe-user.select";

export const safeSessionSelect = {
    id: true,
    user_id: true,
    token: false,
    refresh_token: false,
    ip_address: true,
    user_agent: true,
    expires_at: true,
    created_at: true,
    last_used_at: true,
    is_revoked: true,
    user: {
        select: safeUserSelect
    },
} satisfies Prisma.SessionSelect;