import { DomainError } from '../../../shared/domain/domain-error';

export class InvalidEmailError extends DomainError {
  readonly code = 'IDENTITY_INVALID_EMAIL';
  readonly kind = 'VALIDATION';
  constructor(raw: string) {
    super(`"${raw}" is not a valid email address`);
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
