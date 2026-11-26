export interface IssuedVerificationToken {
  token: string;
  expiresAt: Date;
}

/**
 * A short-lived pass that says "this browser may verify user X's contacts",
 * and nothing else. Given right after register, or after a correct password
 * on an unverified account. It is NOT a session: it can't call any other API.
 */
export interface VerificationTokenService {
  issue(userId: string): Promise<IssuedVerificationToken>;
  /** The user id, or null if the token is missing, forged, expired or not a verification token. */
  verify(token: unknown): Promise<string | null>;
}

export const VERIFICATION_TOKEN_SERVICE = Symbol('VERIFICATION_TOKEN_SERVICE');
