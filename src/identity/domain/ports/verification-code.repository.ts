import { VerificationChannel } from '../verification/verification-channel.enum';
import { VerificationCode } from '../verification/verification-code.aggregate';

/** Port. Implemented in infra/repository. */
export interface VerificationCodeRepository {
  /** The newest code for this user and channel, the only one that counts. */
  findLatest(
    userId: string,
    channel: VerificationChannel,
  ): Promise<VerificationCode | null>;
  /**
   * Inserts a new code or updates an existing one with an optimistic lock on
   * `version`. Throws ConcurrentVerificationUpdateError if another request
   * saved it after it was loaded (two guesses racing on one code).
   */
  save(code: VerificationCode): Promise<void>;
}

export const VERIFICATION_CODE_REPOSITORY = Symbol(
  'VERIFICATION_CODE_REPOSITORY',
);
