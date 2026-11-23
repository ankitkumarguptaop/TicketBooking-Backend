import { ApiProperty } from '@nestjs/swagger';
import { VerificationChannel } from '../../domain/verification/verification-channel.enum';

export class VerificationCodeSentResponseDto {
  @ApiProperty({ enum: VerificationChannel })
  channel!: VerificationChannel;

  @ApiProperty({ example: 'an***@example.com' })
  sentTo!: string;

  @ApiProperty()
  expiresAt!: Date;

  @ApiProperty({ description: 'When a new code may be requested' })
  resendAvailableAt!: Date;
}
