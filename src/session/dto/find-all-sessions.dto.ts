import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

export class FindAllSessionsDto extends PaginationDto {
    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    isRevoked?: boolean;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    includeExpired?: boolean;
}