import { InvalidEmailError } from '../errors/identity.errors';

/** Matches the varchar(320) column: 64 (local) + 1 (@) + 255 (domain). */
const MAX_LENGTH = 320;

/**
 * Pragmatic shape check, not full RFC 5322:
 *   local part @ domain . tld, no whitespace, no second "@".
 * Real proof that the address exists is the verification email.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Email value object: immutable, always valid once created.
 */
export class Email {
  private constructor(private readonly _value: string) {}

  /**
   * The only way to build an Email from user input.
   * Normalising here (trim + lowercase) means every path (register, login,
   * future "change email") agrees that "A@x.com" and "a@x.com" are the same
   * user, which is what makes the unique index on email reliable.
   */
  static create(raw: string): Email {
    const normalised = (raw ?? '').trim().toLowerCase();

    if (normalised.length > MAX_LENGTH || !EMAIL_PATTERN.test(normalised)) {
      throw new InvalidEmailError(raw);
    }

    return new Email(normalised);
  }

  /** Used by the persistence mapper for values already validated on write. */
  static fromPersistence(value: string): Email {
    return new Email(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }
}
