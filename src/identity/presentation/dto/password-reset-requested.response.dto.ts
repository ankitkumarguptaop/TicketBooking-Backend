import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetRequestedResponseDto {
  @ApiProperty({ description: 'When a new code may be requested' })
  resendAvailableAt!: Date;
}
