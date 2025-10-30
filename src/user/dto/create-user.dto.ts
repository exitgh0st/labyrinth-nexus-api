import { IsString, IsBoolean, IsOptional, IsEmail } from 'class-validator';
import { UpdatePasswordDto } from './update-user-password.dto';

export class CreateUserDto extends UpdatePasswordDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  display_name?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
