import { IsBoolean, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { PaginationDto } from "src/shared/dto/pagination.dto";

export class FindAllUsersDto extends PaginationDto {
    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;
}