/**
 * Event handlers run after the outbox row is already marked published, so
 * a thrown error would lose the reaction. Retry a few times with backoff
 * (covers a lost optimistic lock or a DB blip) before giving up loudly.
 */
export async function withRetry<T>(
  work: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 200,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await work();
    } catch (err) {
      if (attempt >= attempts) throw err;
      await new Promise((resolve) =>
        setTimeout(resolve, baseDelayMs * 2 ** (attempt - 1)),
      );
    }
  }
}
