import { IsString, IsBoolean, IsOptional, IsEmail } from 'class-validator';
import { UpdatePasswordDto } from './update-user-password.dto';

export class CreateUserDto extends UpdatePasswordDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
