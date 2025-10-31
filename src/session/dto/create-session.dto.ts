import { IsInt, IsString, IsOptional, IsDate, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSessionDto {
    @IsInt()
    user_id: string;

    @IsString()
    @IsNotEmpty()
    session_id: string;

    @IsString()
    @IsNotEmpty()
    refresh_token_hash: string;

    @IsOptional()
    @IsString()
    ip_address?: string;

    @IsOptional()
    @IsString()
    user_agent?: string;

    @Type(() => Date)
    @IsDate()
    expires_at: Date;

    @IsOptional()
    @IsInt()
    previous_session_id?: number;
}
