import { IsBoolean, IsOptional, IsString } from "class-validator";
import { PaginationDto } from "src/shared/dto/pagination.dto";

export class FindAllUsersDto extends PaginationDto {
    @IsOptional()
    @IsString()
    role_id?: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}