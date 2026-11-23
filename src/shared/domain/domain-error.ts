/**
 * Semantic category of a domain error. The presentation layer maps each
 * kind to an HTTP status in one place (DomainErrorFilter).
 */
export type DomainErrorKind =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'INVALID_STATE'
  /** Asked too often (e.g. resend an OTP within the cooldown). */
  | 'TOO_MANY_REQUESTS';

export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly kind: DomainErrorKind;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
