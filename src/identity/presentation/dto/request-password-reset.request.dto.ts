import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class RequestPasswordResetRequestDto {
  @ApiProperty({ example: 'ankit@example.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;
}
