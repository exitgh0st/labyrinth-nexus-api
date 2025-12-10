import { IsString, IsBoolean, IsOptional, IsEmail, IsNumber, IsArray, IsInt, MinLength, IsNotEmpty } from 'class-validator';
import { UpdatePasswordDto } from './update-user-password.dto';

export class CreateUserDto {
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

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  password: string;
}
