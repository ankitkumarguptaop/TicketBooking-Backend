import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponseDto } from './user-profile.response.dto';

/** Tokens travel only in httpOnly cookies; the body carries display data. */
export class LoginResponseDto {
  @ApiProperty({ type: UserProfileResponseDto })
  user!: UserProfileResponseDto;

  @ApiProperty()
  accessTokenExpiresAt!: Date;
}
