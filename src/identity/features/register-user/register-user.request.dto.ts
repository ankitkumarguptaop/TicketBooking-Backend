import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterUserRequestDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fullName!: string;
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'phone must be 10-15 digits, optionally starting with +',
  })
  phone!: string;
}
