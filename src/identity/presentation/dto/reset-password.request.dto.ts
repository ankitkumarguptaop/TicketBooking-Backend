import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResetPasswordRequestDto {
  @ApiProperty({ example: 'ankit@example.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ example: '123456' })
  @Matches(/^[0-9]{6}$/, { message: 'code must be 6 digits' })
  code!: string;

  /** Same rules as registration. */
  @ApiProperty({ minLength: 8, maxLength: 72, example: 'N3w-S3cure-pass' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}
