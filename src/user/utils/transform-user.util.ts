import { Prisma, Role } from "generated/prisma";
import { userSelect } from "../selects/user-select";
import { safeUserSelect } from "../selects/safe-user-select";

export type User = Prisma.UserGetPayload<{ select: typeof userSelect; }>;

export type FormattedUser = Omit<User, 'userRoles'> & {
  roles: Role[];
};

export type SafeUser = Prisma.UserGetPayload<{ select: typeof safeUserSelect; }>;

export type FormattedSafeUser = Omit<SafeUser, 'userRoles'> & {
  roles: Role[];
};

type UserWithRoles = { userRoles: Array<{ role: Role }> };

function transformUserBase<T extends UserWithRoles>(
  user: T
): Omit<T, 'userRoles'> & { roles: Role[] } {
  const { userRoles, ...rest } = user;
  return {
    ...rest,
    roles: userRoles.map(ur => ur.role)
  } as Omit<T, 'userRoles'> & { roles: Role[] };
}

export const transformUser = (user: User): FormattedUser => 
  transformUserBase(user);

export const transformSafeUser = (safeUser: SafeUser): FormattedSafeUser => 
  transformUserBase(safeUser);