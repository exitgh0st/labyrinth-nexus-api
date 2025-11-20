import { FormattedSafeUser } from "src/user/utils/transform-user.util";

export interface AuthResult {
    accessToken: string;
    refreshToken: string;
    user: FormattedSafeUser
}