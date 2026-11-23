import { ApiProperty } from '@nestjs/swagger';

/** What the sign-up verification screen needs, and nothing more. */
export class VerificationStatusResponseDto {
  @ApiProperty({ example: 'ankit@example.com' })
  email!: string;

  @ApiProperty({ example: '+919876543210' })
  phone!: string;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty()
  phoneVerified!: boolean;
}
