import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginUserRequestDto {
  @ApiProperty({ example: 'ankit@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'S3cure-pass' })
  @IsString()
  @MaxLength(72)
  password!: string;
}
