import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { UpdatePasswordDto } from './update-user-password.dto';

export class CreateUserDto extends UpdatePasswordDto {
  @IsString()
  username: string;

  @IsString()
  role: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
