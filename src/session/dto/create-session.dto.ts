import { IsInt, IsString, IsOptional, IsDate, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSessionDto {
    @IsInt()
    userId: string;

    @IsString()
    @IsNotEmpty()
    sessionId: string;

    @IsString()
    @IsNotEmpty()
    refreshTokenHash: string;

    @IsOptional()
    @IsString()
    ipAddress?: string;

    @IsOptional()
    @IsString()
    userAgent?: string;

    @Type(() => Date)
    @IsDate()
    expiresAt: Date;

    @IsOptional()
    @IsInt()
    previousSessionId?: number;
}
