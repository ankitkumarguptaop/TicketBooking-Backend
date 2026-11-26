import { VerificationChannel } from '../../domain/verification/verification-channel.enum';

export class VerificationCodeSentResponseDto {
  channel!: VerificationChannel;
  sentTo!: string;
  expiresAt!: Date;
  resendAvailableAt!: Date;
}
