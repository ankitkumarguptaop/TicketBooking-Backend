import {
  ContactChannel,
  VerificationChannel,
} from '../../../domain/verification/verification-channel.enum';

/**
 * "ankit@example.com" -> "an***@example.com", "+919876543210" -> "*********3210".
 * Enough for the user to recognise where the code went, without the API
 * echoing the full contact to whoever holds the session.
 */
export function maskContact(channel: ContactChannel, contact: string): string {
  if (channel === VerificationChannel.EMAIL) {
    const at = contact.lastIndexOf('@');
    const local = contact.slice(0, at);
    return `${local.slice(0, 2)}***${contact.slice(at)}`;
  }
  return `${'*'.repeat(Math.max(0, contact.length - 4))}${contact.slice(-4)}`;
}
