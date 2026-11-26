import { VerificationCode } from '../../domain/verification/verification-code.aggregate';
import { VerificationCodeOrmEntity } from '../entities/verification-code.orm-entity';

export class VerificationCodeMapper {
  static toDomain(row: VerificationCodeOrmEntity): VerificationCode {
    return VerificationCode.rehydrate({
      id: row.id,
      userId: row.userId,
      channel: row.channel,
      destination: row.destination,
      codeHash: row.codeHash,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      attempts: row.attempts,
      consumedAt: row.consumedAt,
      version: row.version,
    });
  }

  /** The only columns that change after insert. */
  static toChangedColumns(
    code: VerificationCode,
  ): Pick<VerificationCodeOrmEntity, 'attempts' | 'consumedAt'> {
    return { attempts: code.attempts, consumedAt: code.consumedAt };
  }
}
