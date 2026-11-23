import {
  VerificationCodeExpiredError,
  VerificationCodeInvalidError,
  VerificationCodeLockedError,
  VerificationResendTooSoonError,
} from '../errors/identity.errors';
import { VerificationChannel } from './verification-channel.enum';
import {
  VERIFICATION_CODE_POLICY,
  VerificationCode,
} from './verification-code.aggregate';

const T0 = new Date('2026-01-01T10:00:00Z');
const at = (ms: number) => new Date(T0.getTime() + ms);
const EMAIL = 'ankit@example.com';

function issue(previous: VerificationCode | null = null, now = T0) {
  return VerificationCode.issue(
    {
      id: 'code-1',
      userId: 'user-1',
      channel: VerificationChannel.EMAIL,
      destination: EMAIL,
      codeHash: 'right-hash',
      now,
    },
    previous,
  );
}

describe('VerificationCode', () => {
  it('accepts the right code once', () => {
    const code = issue();
    code.verify('right-hash', EMAIL, at(1000));
    expect(code.consumedAt).toEqual(at(1000));
    expect(() => code.verify('right-hash', EMAIL, at(2000))).toThrow(
      VerificationCodeExpiredError,
    );
  });

  it('counts wrong guesses and reports attempts left', () => {
    const code = issue();
    expect(() => code.verify('wrong', EMAIL, at(1000))).toThrow(
      new VerificationCodeInvalidError(4),
    );
    expect(code.attempts).toBe(1);
  });

  it('locks after maxAttempts, even if the next guess is right', () => {
    const code = issue();
    for (let i = 1; i < VERIFICATION_CODE_POLICY.maxAttempts; i++) {
      expect(() => code.verify('wrong', EMAIL, at(i))).toThrow(
        VerificationCodeInvalidError,
      );
    }
    expect(() => code.verify('wrong', EMAIL, at(10))).toThrow(
      VerificationCodeLockedError,
    );
    expect(() => code.verify('right-hash', EMAIL, at(11))).toThrow(
      VerificationCodeLockedError,
    );
  });

  it('expires after the TTL', () => {
    const code = issue();
    expect(() =>
      code.verify('right-hash', EMAIL, at(VERIFICATION_CODE_POLICY.ttlMs)),
    ).toThrow(VerificationCodeExpiredError);
  });

  it('refuses a code sent to a contact the user has since changed', () => {
    const code = issue();
    expect(() => code.verify('right-hash', 'new@example.com', at(1))).toThrow(
      VerificationCodeExpiredError,
    );
  });

  it('enforces the resend cooldown for the same destination only', () => {
    const first = issue();
    expect(() => issue(first, at(30_000))).toThrow(
      new VerificationResendTooSoonError(30),
    );
    expect(() =>
      issue(first, at(VERIFICATION_CODE_POLICY.resendCooldownMs)),
    ).not.toThrow();
    const otherDestination = VerificationCode.rehydrate({
      ...first['props'],
      destination: 'old@example.com',
    });
    expect(() => issue(otherDestination, at(1))).not.toThrow();
  });
});

describe('VerificationCode purposes', () => {
  it('keeps the resend cooldown per purpose: a reset code right after a sign-up code is fine', () => {
    const t0 = new Date('2026-01-01T10:00:00Z');
    const base = {
      userId: 'user-1',
      destination: 'ankit@example.com',
      codeHash: 'h',
      now: t0,
    };
    const signUp = VerificationCode.issue(
      { ...base, id: 'c1', channel: VerificationChannel.EMAIL },
      null,
    );
    // The repository looks up the newest code PER CHANNEL, so the reset's
    // "previous" is null, not the sign-up code.
    const reset = VerificationCode.issue(
      { ...base, id: 'c2', channel: VerificationChannel.PASSWORD_RESET },
      null,
    );
    expect(signUp.channel).not.toBe(reset.channel);
  });
});
