/**
 * Compares two strings in time that depends only on their length, not on
 * where they first differ. Used for secret/hash comparisons so an attacker
 * cannot learn a stored hash byte-by-byte from response timing.
 * Pure TypeScript so the domain layer can use it without node:crypto.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
