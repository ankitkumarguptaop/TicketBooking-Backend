import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordResponseDto {
  @ApiProperty({
    example: 'If an account exists for that email, a reset link is on its way.',
  })
  message!: string;
}
