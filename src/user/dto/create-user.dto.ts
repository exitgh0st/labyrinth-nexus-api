import { IsString, IsBoolean, IsOptional, IsEmail, IsNumber, IsArray, IsInt } from 'class-validator';
import { UpdatePasswordDto } from './update-user-password.dto';

export class CreateUserDto extends UpdatePasswordDto {
  @IsEmail()
  email: string;

  @IsArray()
  @IsInt({ each: true })
  roleIds: number[];

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
