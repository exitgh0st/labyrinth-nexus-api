import { IsInt, IsString, IsOptional, IsDate, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSessionDto {
    @IsInt()
    user_id: number;

    @IsString()
    @IsNotEmpty()
    token: string;

    @IsString()
    @IsNotEmpty()
    refresh_token: string;

    @IsOptional()
    @IsString()
    ip_address?: string;

    @IsOptional()
    @IsString()
    user_agent?: string;

    @Type(() => Date)
    @IsDate()
    expires_at: Date;
}

