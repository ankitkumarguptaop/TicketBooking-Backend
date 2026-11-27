import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConcurrentVerificationUpdateError } from '../../domain/errors/identity.errors';
import { VerificationChannel } from '../../domain/verification/verification-channel.enum';
import { VerificationCode } from '../../domain/verification/verification-code.aggregate';
import { VerificationCodeRepository } from '../../domain/ports/verification-code.repository';
import { VerificationCodeMapper } from '../mappers/verification-code.mapper';
import { VerificationCodeOrmEntity } from '../entities/verification-code.orm-entity';

/** Aliased to the VerificationCodeOrmEntity field names, so the mapper reads rows as-is. */
const CODE_COLUMNS = `
  id, user_id AS "userId", channel, destination, code_hash AS "codeHash",
  created_at AS "createdAt", expires_at AS "expiresAt", attempts,
  consumed_at AS "consumedAt", version
`;

@Injectable()
export class TypeOrmVerificationCodeRepository implements VerificationCodeRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findLatest(
    userId: string,
    channel: VerificationChannel,
  ): Promise<VerificationCode | null> {
    const rows = await this.dataSource.query<VerificationCodeOrmEntity[]>(
      `SELECT ${CODE_COLUMNS}
         FROM identity.verification_codes
        WHERE user_id = $1 AND channel = $2
        ORDER BY created_at DESC
        LIMIT 1`,
      [userId, channel],
    );
    return rows[0] ? VerificationCodeMapper.toDomain(rows[0]) : null;
  }

  async save(code: VerificationCode): Promise<void> {
    const changed = VerificationCodeMapper.toChangedColumns(code);

    if (code.version === 0) {
      await this.dataSource.query(
        `INSERT INTO identity.verification_codes
           (id, user_id, channel, destination, code_hash, created_at,
            expires_at, version, attempts, consumed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, $9)`,
        [
          code.id,
          code.userId,
          code.channel,
          code.destination,
          code.codeHash,
          code.createdAt,
          code.expiresAt,
          changed.attempts,
          changed.consumedAt,
        ],
      );
      return;
    }

    // Compare-and-swap: without it, 10 parallel guesses could all read
    // attempts=0 and each write attempts=1, bypassing the 5-guess limit.
    const [, affected] = await this.dataSource.query<[unknown, number]>(
      `UPDATE identity.verification_codes
          SET attempts    = $3,
              consumed_at = $4,
              version     = version + 1
        WHERE id = $1 AND version = $2`,
      [code.id, code.version, changed.attempts, changed.consumedAt],
    );
    if (affected !== 1) {
      throw new ConcurrentVerificationUpdateError();
    }
  }
}
