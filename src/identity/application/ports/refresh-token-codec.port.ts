export interface GeneratedRefreshToken {
  /** Opaque value for the cookie. Never stored. */
  token: string;
  /** What the database stores. Useless without the server-side pepper. */
  hash: string;
}

export interface ParsedRefreshToken {
  sessionId: string;
  hash: string;
}

/**
 * Creates and reads opaque refresh tokens of the form `<sessionId>.<secret>`.
 * The session id lets us find the row in O(1); the secret is 256 random bits.
 */
export interface RefreshTokenCodec {
  generate(sessionId: string): GeneratedRefreshToken;
  /** Returns null for anything malformed. Never throws on user input. */
  parse(raw: unknown): ParsedRefreshToken | null;
}

export const REFRESH_TOKEN_CODEC = Symbol('REFRESH_TOKEN_CODEC');
