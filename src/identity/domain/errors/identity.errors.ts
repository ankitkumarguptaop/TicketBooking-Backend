import { DomainError } from '../../../shared/domain/domain-error';

export class InvalidEmailError extends DomainError {
  readonly code = 'IDENTITY_INVALID_EMAIL';
  readonly kind = 'VALIDATION';
  constructor(raw: string) {
    super(`"${raw}" is not a valid email address`);
  }
}

export class InvalidFullNameError extends DomainError {
  readonly code = 'IDENTITY_INVALID_FULL_NAME';
  readonly kind = 'VALIDATION';
  constructor(maxLength: number) {
    super(`Full name must be between 1 and ${maxLength} characters`);
  }
}

export class InvalidPhoneError extends DomainError {
  readonly code = 'IDENTITY_INVALID_PHONE';
  readonly kind = 'VALIDATION';
  constructor(raw: string) {
    super(
      `"${raw}" is not a valid phone number (optional +, then 10-15 digits)`,
    );
  }
}

export class EmailAlreadyRegisteredError extends DomainError {
  readonly code = 'IDENTITY_EMAIL_ALREADY_REGISTERED';
  readonly kind = 'CONFLICT';
  constructor() {
    super('An account with this email already exists');
  }
}

/** Deliberately vague: never reveal whether the email or the password was wrong. */
export class InvalidCredentialsError extends DomainError {
  readonly code = 'IDENTITY_INVALID_CREDENTIALS';
  readonly kind = 'UNAUTHENTICATED';
  constructor() {
    super('Invalid email or password');
  }
}

export class UserNotFoundError extends DomainError {
  readonly code = 'IDENTITY_USER_NOT_FOUND';
  readonly kind = 'NOT_FOUND';
  constructor(userId: string) {
    super(`User ${userId} not found`);
  }
}

/** Malformed, unknown or forged refresh token. */
export class InvalidRefreshTokenError extends DomainError {
  readonly code = 'IDENTITY_INVALID_REFRESH_TOKEN';
  readonly kind = 'UNAUTHENTICATED';
  constructor() {
    super('Session is no longer valid, please sign in again');
  }
}

export class SessionExpiredError extends DomainError {
  readonly code = 'IDENTITY_SESSION_EXPIRED';
  readonly kind = 'UNAUTHENTICATED';
  constructor() {
    super('Session is no longer valid, please sign in again');
  }
}

export class SessionRevokedError extends DomainError {
  readonly code = 'IDENTITY_SESSION_REVOKED';
  readonly kind = 'UNAUTHENTICATED';
  constructor() {
    super('Session is no longer valid, please sign in again');
  }
}

/** A rotated refresh token was replayed; the session has been revoked. */
export class RefreshTokenReuseDetectedError extends DomainError {
  readonly code = 'IDENTITY_REFRESH_TOKEN_REUSED';
  readonly kind = 'UNAUTHENTICATED';
  constructor() {
    super('Session is no longer valid, please sign in again');
  }
}

/** Unknown session, or one owned by someone else (same answer on purpose). */
export class SessionNotFoundError extends DomainError {
  readonly code = 'IDENTITY_SESSION_NOT_FOUND';
  readonly kind = 'NOT_FOUND';
  constructor(sessionId: string) {
    super(`Session ${sessionId} not found`);
  }
}

/** Two writers changed the same session at once (optimistic lock lost). */
export class ConcurrentSessionUpdateError extends DomainError {
  readonly code = 'IDENTITY_CONCURRENT_SESSION_UPDATE';
  readonly kind = 'CONFLICT';
  constructor(sessionId: string) {
    super(`Session ${sessionId} was modified concurrently`);
  }
}

export class InvalidSessionLifetimeError extends DomainError {
  readonly code = 'IDENTITY_INVALID_SESSION_LIFETIME';
  readonly kind = 'VALIDATION';
  constructor(idleTtlSeconds: number, absoluteTtlSeconds: number) {
    super(
      `Invalid session lifetime: idle=${idleTtlSeconds}s absolute=${absoluteTtlSeconds}s ` +
        '(both must be positive integers and idle <= absolute)',
    );
  }
}

/** The email or phone is already verified; no code needed. */
export class AlreadyVerifiedError extends DomainError {
  readonly code = 'IDENTITY_ALREADY_VERIFIED';
  readonly kind = 'CONFLICT';
  constructor(channel: string) {
    super(`Your ${channel.toLowerCase()} is already verified`);
  }
}

/** A new code was asked for before the resend cooldown ended. */
export class VerificationResendTooSoonError extends DomainError {
  readonly code = 'IDENTITY_VERIFICATION_RESEND_TOO_SOON';
  readonly kind = 'TOO_MANY_REQUESTS';
  constructor(readonly retryAfterSeconds: number) {
    super(
      `Please wait ${retryAfterSeconds} seconds before requesting a new code`,
    );
  }
}

/** Confirm was called but no code was ever sent for this channel. */
export class NoVerificationCodeError extends DomainError {
  readonly code = 'IDENTITY_NO_VERIFICATION_CODE';
  readonly kind = 'INVALID_STATE';
  constructor() {
    super('No code has been sent yet. Request a new code');
  }
}

export class VerificationCodeInvalidError extends DomainError {
  readonly code = 'IDENTITY_VERIFICATION_CODE_INVALID';
  readonly kind = 'VALIDATION';
  constructor(readonly attemptsLeft: number) {
    super(
      `That code isn't right. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left`,
    );
  }
}

/**
 * Expired, already used, or sent to an address/number the user has since
 * changed. Same message for all: in every case the answer is "get a new code".
 */
export class VerificationCodeExpiredError extends DomainError {
  readonly code = 'IDENTITY_VERIFICATION_CODE_EXPIRED';
  readonly kind = 'VALIDATION';
  constructor() {
    super('This code has expired. Request a new code');
  }
}

/** Too many wrong guesses: this code is dead, even if the next guess is right. */
export class VerificationCodeLockedError extends DomainError {
  readonly code = 'IDENTITY_VERIFICATION_CODE_LOCKED';
  readonly kind = 'TOO_MANY_REQUESTS';
  constructor() {
    super('Too many wrong attempts. Request a new code');
  }
}

/** Two requests used the same code at once (optimistic lock lost). */
export class ConcurrentVerificationUpdateError extends DomainError {
  readonly code = 'IDENTITY_CONCURRENT_VERIFICATION_UPDATE';
  readonly kind = 'CONFLICT';
  constructor() {
    super('This code was used by another request at the same time. Try again');
  }
}

/**
 * Right password, but the email was never verified. Only thrown AFTER the
 * password check, so it reveals nothing to someone guessing emails.
 * Carries the user id so the controller can start verification; the
 * error filter never sends it to the client.
 */
export class EmailNotVerifiedError extends DomainError {
  readonly code = 'IDENTITY_EMAIL_NOT_VERIFIED';
  readonly kind = 'FORBIDDEN';
  constructor(readonly userId: string) {
    super("Your email isn't verified. Complete your registration to sign in");
  }
}

/* ---------------------------- admin access ---------------------------- */

export class InvalidAdminAccessReasonError extends DomainError {
  readonly code = 'IDENTITY_INVALID_ADMIN_ACCESS_REASON';
  readonly kind = 'VALIDATION';
  constructor(min: number, max: number) {
    super(`Reason must be between ${min} and ${max} characters`);
  }
}

export class InvalidDecisionNoteError extends DomainError {
  readonly code = 'IDENTITY_INVALID_DECISION_NOTE';
  readonly kind = 'VALIDATION';
  constructor(max: number) {
    super(`Note must be at most ${max} characters`);
  }
}

/** Only a verified USER may ask; admins and the super admin can't. */
export class NotEligibleForAdminAccessError extends DomainError {
  readonly code = 'IDENTITY_NOT_ELIGIBLE_FOR_ADMIN_ACCESS';
  readonly kind = 'FORBIDDEN';
  constructor(why: 'ALREADY_ADMIN' | 'EMAIL_NOT_VERIFIED') {
    super(
      why === 'ALREADY_ADMIN'
        ? 'You already have admin rights'
        : 'Verify your email before requesting admin access',
    );
  }
}

/** One open request per user at a time. */
export class AdminAccessRequestAlreadyPendingError extends DomainError {
  readonly code = 'IDENTITY_ADMIN_ACCESS_ALREADY_PENDING';
  readonly kind = 'CONFLICT';
  constructor() {
    super('You already have a pending admin access request');
  }
}

/** Unknown request, or someone else's (same answer on purpose). */
export class AdminAccessRequestNotFoundError extends DomainError {
  readonly code = 'IDENTITY_ADMIN_ACCESS_REQUEST_NOT_FOUND';
  readonly kind = 'NOT_FOUND';
  constructor(requestId: string) {
    super(`Admin access request ${requestId} not found`);
  }
}

/** Approve/reject/cancel on a request that was already decided. */
export class AdminAccessRequestNotPendingError extends DomainError {
  readonly code = 'IDENTITY_ADMIN_ACCESS_REQUEST_NOT_PENDING';
  readonly kind = 'CONFLICT';
  constructor(status: string) {
    super(`This request is already ${status.toLowerCase()}`);
  }
}

/** Two super-admin tabs decided the same request at once (optimistic lock lost). */
export class ConcurrentAdminAccessUpdateError extends DomainError {
  readonly code = 'IDENTITY_CONCURRENT_ADMIN_ACCESS_UPDATE';
  readonly kind = 'CONFLICT';
  constructor() {
    super('This request was changed by someone else. Reload and try again');
  }
}

/** The super admin's role is fixed: it comes from the seed, never from the API. */
export class SuperAdminRoleImmutableError extends DomainError {
  readonly code = 'IDENTITY_SUPER_ADMIN_ROLE_IMMUTABLE';
  readonly kind = 'FORBIDDEN';
  constructor() {
    super("The super admin's role can't be changed");
  }
}

export class UserIsNotAdminError extends DomainError {
  readonly code = 'IDENTITY_USER_IS_NOT_ADMIN';
  readonly kind = 'INVALID_STATE';
  constructor(userId: string) {
    super(`User ${userId} is not an admin`);
  }
}
