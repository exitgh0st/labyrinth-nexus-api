import { Prisma } from "generated/prisma";
import { userSelect } from "./user-select";

export const safeUserSelect = {
    ...userSelect,
    password_hash: false
} satisfies Prisma.UserSelect;