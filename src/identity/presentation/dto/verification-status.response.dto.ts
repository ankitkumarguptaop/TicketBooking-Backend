/** What the sign-up verification screen needs, and nothing more. */
export class VerificationStatusResponseDto {
  email!: string;
  phone!: string;
  emailVerified!: boolean;
  phoneVerified!: boolean;
}
