import { IsOptional, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

export class FindAllSessionsDto extends PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    user_id?: number;

    @IsOptional()
    @IsBoolean()
    is_revoked?: boolean;

    @IsOptional()
    @IsBoolean()
    include_expired?: boolean;
}