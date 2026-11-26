import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class LoginUserRequestDto {
  @IsEmail()
  email!: string;
  @IsString()
  @MaxLength(72)
  password!: string;
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?: string;
}
