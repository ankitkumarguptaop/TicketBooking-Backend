import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ConfirmVerificationCodeRequestDto {
  @ApiProperty({ example: '042917', description: 'The 6-digit code' })
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'code must be 6 digits' })
  code!: string;
}
