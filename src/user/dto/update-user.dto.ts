import { IsOptional, IsString, IsEmail, IsBoolean, IsDate, IsInt, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserDto } from './create-user.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsBoolean()
  email_verified?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  email_verified_at?: Date | null;

  @IsOptional()
  @IsString()
  password_hash?: string;

  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deleted_at?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  last_login_at?: Date | null;

  @IsOptional()
  @IsInt()
  failed_login_attempts?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  locked_until?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  password_changed_at?: Date | null;
}
