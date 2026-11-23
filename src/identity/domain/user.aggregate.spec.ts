import { ContactVerified } from './events/contact-verified.event';
import { PasswordChanged } from './events/password-changed.event';
import { User } from './user.aggregate';
import { Email } from './value-objects/email.vo';
import { VerificationChannel } from './verification/verification-channel.enum';

const NOW = new Date('2026-01-01T10:00:00Z');

function newUser(): User {
  const user = User.register({
    id: 'user-1',
    email: Email.create('ankit@example.com'),
    passwordHash: 'hash',
    fullName: 'Ankit Kumar',
    phone: '+919876543210',
    now: NOW,
  });
  user.pullDomainEvents();
  return user;
}

describe('User verification', () => {
  it('starts with nothing verified', () => {
    const user = newUser();
    expect(user.isVerified(VerificationChannel.EMAIL)).toBe(false);
    expect(user.isVerified(VerificationChannel.PHONE)).toBe(false);
  });

  it('marks a channel verified once, raising one event', () => {
    const user = newUser();
    user.markVerified(VerificationChannel.EMAIL, NOW);
    user.markVerified(VerificationChannel.EMAIL, new Date());
    expect(user.emailVerifiedAt).toEqual(NOW);
    const events = user.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(ContactVerified);
  });

  it('un-verifies the phone when the number changes, not when it stays', () => {
    const user = newUser();
    user.markVerified(VerificationChannel.PHONE, NOW);

    user.updateDetails({ phone: '+91 98765-43210' }); // same number, formatted
    expect(user.isVerified(VerificationChannel.PHONE)).toBe(true);

    user.updateDetails({ phone: '+919999999999' });
    expect(user.isVerified(VerificationChannel.PHONE)).toBe(false);
  });

  it('sends codes to the current email and phone', () => {
    const user = newUser();
    expect(user.contactFor(VerificationChannel.EMAIL)).toBe(
      'ankit@example.com',
    );
    expect(user.contactFor(VerificationChannel.PHONE)).toBe('+919876543210');
  });
});

describe('User password reset', () => {
  it('replaces the hash, raises PasswordChanged and verifies the email', () => {
    const user = newUser();
    user.resetPassword('new-hash', NOW);
    expect(user.passwordHash).toBe('new-hash');
    expect(user.isVerified(VerificationChannel.EMAIL)).toBe(true);
    expect(user.isVerified(VerificationChannel.PHONE)).toBe(false);
    const events = user.pullDomainEvents();
    expect(events.some((e) => e instanceof PasswordChanged)).toBe(true);
    expect(events.some((e) => e instanceof ContactVerified)).toBe(true);
  });
});
