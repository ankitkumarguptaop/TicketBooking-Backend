/**
 * Email value object: immutable, always valid once created.
 */
export class Email {
  private constructor(private readonly _value: string) {}

  /**
   * TODO(you): implement.
   *  - trim + lowercase the raw input (so "A@x.com" and "a@x.com" are the same user)
   *  - reject invalid formats by throwing InvalidEmailError
   *  - return new Email(normalised)
   * Hint: this is where the "email is unique" invariant becomes reliable,
   * because uniqueness only works on a normalised value.
   */
  static create(raw: string): Email {
    void raw;
    throw new Error('Email.create not implemented yet');
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
