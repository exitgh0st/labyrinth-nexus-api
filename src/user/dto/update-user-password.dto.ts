import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  password: string;

  @IsString()
  @IsNotEmpty()
  currentPassword?: string;
}