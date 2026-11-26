export interface GeneratedOtp {
  /** 6 digits, sent to the user. Never stored. */
  code: string;
  /** What the database stores. */
  hash: string;
}

/**
 * Creates and hashes one-time codes. `scope` (e.g. "<userId>:EMAIL") is
 * mixed into the hash, so a code's hash only matches for that user and channel.
 */
export interface OtpCodec {
  generate(scope: string): GeneratedOtp;
  hash(scope: string, code: string): string;
}

export const OTP_CODEC = Symbol('OTP_CODEC');

/** The hash scope for one user's codes on one channel. */
export function otpScope(userId: string, channel: string): string {
  return `${userId}:${channel}`;
}
