import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsString()
  password_hash: string;

  @IsString()
  role: string;

  @IsBoolean()
  is_active?: boolean;
}
