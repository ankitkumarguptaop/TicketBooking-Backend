import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { constantTimeEquals } from '../../../shared/domain/constant-time-equals';
import {
  VerificationCodeExpiredError,
  VerificationCodeInvalidError,
  VerificationCodeLockedError,
  VerificationResendTooSoonError,
} from '../errors/identity.errors';
import { VerificationChannel } from './verification-channel.enum';

/**
 * The numbers behind the rules, in one place.
 *  - 10 minutes: long enough to switch to the mail app, short enough that an
 *    old code in an inbox is useless.
 *  - 5 attempts: a 6-digit code has 1,000,000 values, so 5 guesses succeed
 *    with probability 0.0005%. Without a cap, a script tries them all.
 *  - 60 s cooldown: stops someone using us to spam an inbox or run up an SMS bill.
 */
export const VERIFICATION_CODE_POLICY = {
  ttlMs: 10 * 60 * 1000,
  resendCooldownMs: 60 * 1000,
  maxAttempts: 5,
} as const;

export interface VerificationCodeProps {
  id: string;
  userId: string;
  channel: VerificationChannel;
  /** The email or phone the code was sent to, as it was at that moment. */
  destination: string;
  /** HMAC of the code. The code itself is never stored. */
  codeHash: string;
  createdAt: Date;
  expiresAt: Date;
  /** Guesses made so far, right or wrong. */
  attempts: number;
  /** Set once the right code was entered. A code works exactly once. */
  consumedAt: Date | null;
  /** Optimistic-lock version as loaded from storage. 0 = never persisted. */
  version: number;
}

export interface IssueVerificationCodeParams {
  id: string;
  userId: string;
  channel: VerificationChannel;
  destination: string;
  codeHash: string;
  now: Date;
}

/**
 * One code sent to one email address or phone number (Identity context).
 *
 * Only the NEWEST code per user and channel counts: the repository returns
 * that one, so issuing a new code makes every older one useless without
 * having to touch them.
 *
 * Invariants:
 *  - a code is accepted at most once, and only before it expires
 *  - at most maxAttempts guesses, then it is locked for good
 *  - a code proves only the destination it was sent to
 */
export class VerificationCode extends AggregateRoot {
  private constructor(private props: VerificationCodeProps) {
    super();
  }

  /**
   * Creates a new code. `previous` is the newest existing code for this user
   * and channel (or null). Throws VerificationResendTooSoonError if it was
   * sent to the same destination less than the cooldown ago. A NEW
   * destination (the user just changed their phone) may get a code at once.
   */
  static issue(
    params: IssueVerificationCodeParams,
    previous: VerificationCode | null,
  ): VerificationCode {
    const { now } = params;

    if (previous && previous.destination === params.destination) {
      const waitMs = previous.resendAvailableAt.getTime() - now.getTime();
      if (waitMs > 0) {
        throw new VerificationResendTooSoonError(Math.ceil(waitMs / 1000));
      }
    }

    return new VerificationCode({
      id: params.id,
      userId: params.userId,
      channel: params.channel,
      destination: params.destination,
      codeHash: params.codeHash,
      createdAt: now,
      expiresAt: new Date(now.getTime() + VERIFICATION_CODE_POLICY.ttlMs),
      attempts: 0,
      consumedAt: null,
      version: 0,
    });
  }

  static rehydrate(props: VerificationCodeProps): VerificationCode {
    return new VerificationCode({ ...props });
  }

  /**
   * Checks a guess. On success the code is consumed. On a wrong guess it
   * counts the attempt and throws.
   *
   * The caller must save the code even when this throws, otherwise the
   * attempt counter never goes up and the 5-guess limit means nothing.
   *
   * @param currentDestination the user's email/phone NOW. If it changed since
   *   the code was sent, the code proves the old one, so it's refused.
   */
  verify(presentedHash: string, currentDestination: string, now: Date): void {
    if (
      this.props.consumedAt !== null ||
      now >= this.props.expiresAt ||
      currentDestination !== this.props.destination
    ) {
      throw new VerificationCodeExpiredError();
    }
    if (this.props.attempts >= VERIFICATION_CODE_POLICY.maxAttempts) {
      throw new VerificationCodeLockedError();
    }

    // Count the guess BEFORE comparing, so every guess costs one attempt.
    this.props.attempts += 1;

    if (!constantTimeEquals(presentedHash, this.props.codeHash)) {
      const attemptsLeft =
        VERIFICATION_CODE_POLICY.maxAttempts - this.props.attempts;
      if (attemptsLeft === 0) throw new VerificationCodeLockedError();
      throw new VerificationCodeInvalidError(attemptsLeft);
    }

    this.props.consumedAt = now;
  }

  /** When the user may ask for another code for the same destination. */
  get resendAvailableAt(): Date {
    return new Date(
      this.props.createdAt.getTime() +
        VERIFICATION_CODE_POLICY.resendCooldownMs,
    );
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get channel(): VerificationChannel {
    return this.props.channel;
  }
  get destination(): string {
    return this.props.destination;
  }
  get codeHash(): string {
    return this.props.codeHash;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get attempts(): number {
    return this.props.attempts;
  }
  get consumedAt(): Date | null {
    return this.props.consumedAt;
  }
  get version(): number {
    return this.props.version;
  }
}
