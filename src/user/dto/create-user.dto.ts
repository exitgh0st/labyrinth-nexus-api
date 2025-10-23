import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  role: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
