/**
 * Lets JwtAuthGuard ask "is this session still live?" without knowing how
 * sessions are stored. Identity implements it; every other context only
 * sees this interface.
 */
export interface ActiveSessionChecker {
  isActive(sessionId: string, userId: string, now: Date): Promise<boolean>;
}

export const ACTIVE_SESSION_CHECKER = Symbol('ACTIVE_SESSION_CHECKER');
