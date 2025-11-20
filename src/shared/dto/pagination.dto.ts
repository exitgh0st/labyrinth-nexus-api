import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    skip?: number = 0;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    take?: number = 10;
}