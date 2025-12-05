import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    skip?: number = 0;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0) // Allow 0 to return all records
    @Max(100)
    take?: number = 10;
}