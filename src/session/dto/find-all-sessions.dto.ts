import { IsOptional, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

export class FindAllSessionsDto extends PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    userId?: string;

    @IsOptional()
    @IsBoolean()
    isRevoked?: boolean;

    @IsOptional()
    @IsBoolean()
    includeExpired?: boolean;
}