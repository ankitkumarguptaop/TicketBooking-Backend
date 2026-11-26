import { AuthSession } from '../session/auth-session.aggregate';

/** Port. Implemented in infra/repository. */
export interface AuthSessionRepository {
  findById(id: string): Promise<AuthSession | null>;
  /** Not revoked and not expired at `now`, newest first. */
  findActiveByUserId(userId: string, now: Date): Promise<AuthSession[]>;
  /**
   * Inserts a new session or updates an existing one with an optimistic
   * lock on `version`. Throws ConcurrentSessionUpdateError if someone else
   * saved the session after it was loaded. The pulled domain events are
   * written to the outbox in the same transaction.
   */
  save(session: AuthSession): Promise<void>;
}

export const AUTH_SESSION_REPOSITORY = Symbol('AUTH_SESSION_REPOSITORY');
