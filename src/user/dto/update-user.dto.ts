import { IsOptional, IsString, IsEmail, IsBoolean, IsDate, IsInt, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserDto } from './create-user.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  emailVerifiedAt?: Date | null;

  @IsOptional()
  @IsString()
  passwordHash?: string;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deletedAt?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastLoginAt?: Date | null;

  @IsOptional()
  @IsInt()
  failedLoginAttempts?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lockedUntil?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  passwordChangedAt?: Date | null;
}
