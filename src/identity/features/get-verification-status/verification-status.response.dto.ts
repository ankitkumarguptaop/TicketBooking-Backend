import { UserProfileView } from '../get-user-profile/user-profile.view';

/** What the sign-up verification screen needs, and nothing more. */
export class VerificationStatusResponseDto {
  email!: string;
  phone!: string;
  emailVerified!: boolean;
  phoneVerified!: boolean;
}

export function toVerificationStatus(
  user: UserProfileView,
): VerificationStatusResponseDto {
  return {
    email: user.email,
    phone: user.phone,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
  };
}
