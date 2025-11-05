import { SafeUser } from "src/user/user.service";

export interface AuthResult {
    accessToken: string;
    refreshToken: string;
    user: SafeUser
}