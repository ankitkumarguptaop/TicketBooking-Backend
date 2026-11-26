import { UserProfileResponseDto } from './user-profile.response.dto';

/** Tokens travel only in httpOnly cookies; the body carries display data. */
export class LoginResponseDto {
  user!: UserProfileResponseDto;
  accessTokenExpiresAt!: Date;
}
