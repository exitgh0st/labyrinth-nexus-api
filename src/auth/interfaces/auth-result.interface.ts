export interface AuthResult {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
}