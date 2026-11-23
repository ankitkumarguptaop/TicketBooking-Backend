/**
 * What a verification code is for. EMAIL and PHONE prove a contact;
 * PASSWORD_RESET is sent to the email and lets the user set a new password.
 * Each has its own "newest code" and its own hash scope, so a sign-up code
 * can never be used to reset a password, or the other way round.
 */
export enum VerificationChannel {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

/** The channels that prove a contact. User methods accept only these. */
export type ContactChannel =
  VerificationChannel.EMAIL | VerificationChannel.PHONE;
