import { InvalidSessionLifetimeError } from '../errors/identity.errors';

/**
 * How long a session may live.
 *  - idle: the refresh token expires if unused for this long (sliding).
 *  - absolute: the session dies this long after login, however active it is.
 *    Rotation never extends past it, so a stolen-and-kept-alive session
 *    still ends.
 */
export class SessionLifetime {
  private constructor(
    readonly idleTtlMs: number,
    readonly absoluteTtlMs: number,
  ) {}

  static of(params: {
    idleTtlSeconds: number;
    absoluteTtlSeconds: number;
  }): SessionLifetime {
    const { idleTtlSeconds, absoluteTtlSeconds } = params;
    if (
      !Number.isInteger(idleTtlSeconds) ||
      !Number.isInteger(absoluteTtlSeconds) ||
      idleTtlSeconds <= 0 ||
      absoluteTtlSeconds < idleTtlSeconds
    ) {
      throw new InvalidSessionLifetimeError(idleTtlSeconds, absoluteTtlSeconds);
    }
    return new SessionLifetime(
      idleTtlSeconds * 1000,
      absoluteTtlSeconds * 1000,
    );
  }
}
