import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class LoginUserRequestDto {
  @ApiProperty({ example: 'ankit@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'S3cure-pass' })
  @IsString()
  @MaxLength(72)
  password!: string;

  @ApiPropertyOptional({
    example: "Ankit's iPhone",
    description: 'Label shown in the session list',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?: string;
}
