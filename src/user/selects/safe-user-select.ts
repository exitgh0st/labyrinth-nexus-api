import { Prisma } from "generated/prisma";
import { userSelect } from "./user-select";

export const safeUserSelect = {
    ...userSelect,
    passwordHash: false
} satisfies Prisma.UserSelect;