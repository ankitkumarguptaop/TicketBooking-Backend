import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterUserRequestDto {
  @ApiProperty({ example: 'ankit@example.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 72, example: 'S3cure-pass' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({ example: 'Ankit Kumar' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fullName!: string;
}
