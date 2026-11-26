import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResetPasswordRequestDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;
  @Matches(/^[0-9]{6}$/, { message: 'code must be 6 digits' })
  code!: string;
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}
