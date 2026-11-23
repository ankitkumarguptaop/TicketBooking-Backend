import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConcurrentVerificationUpdateError } from '../../domain/errors/identity.errors';
import { VerificationChannel } from '../../domain/verification/verification-channel.enum';
import { VerificationCode } from '../../domain/verification/verification-code.aggregate';
import { VerificationCodeRepository } from '../../domain/verification/verification-code.repository';
import { VerificationCodeMapper } from './verification-code.mapper';
import { VerificationCodeOrmEntity } from './verification-code.orm-entity';

@Injectable()
export class TypeOrmVerificationCodeRepository implements VerificationCodeRepository {
  constructor(
    @InjectRepository(VerificationCodeOrmEntity)
    private readonly orm: Repository<VerificationCodeOrmEntity>,
  ) {}

  async findLatest(
    userId: string,
    channel: VerificationChannel,
  ): Promise<VerificationCode | null> {
    const row = await this.orm.findOne({
      where: { userId, channel },
      order: { createdAt: 'DESC' },
    });
    return row ? VerificationCodeMapper.toDomain(row) : null;
  }

  async save(code: VerificationCode): Promise<void> {
    const changed = VerificationCodeMapper.toChangedColumns(code);

    if (code.version === 0) {
      await this.orm.insert({
        id: code.id,
        userId: code.userId,
        channel: code.channel,
        destination: code.destination,
        codeHash: code.codeHash,
        createdAt: code.createdAt,
        expiresAt: code.expiresAt,
        version: 1,
        ...changed,
      });
      return;
    }

    // Compare-and-swap: without it, 10 parallel guesses could all read
    // attempts=0 and each write attempts=1, bypassing the 5-guess limit.
    const result = await this.orm.update(
      { id: code.id, version: code.version },
      { ...changed, version: code.version + 1 },
    );
    if (result.affected !== 1) {
      throw new ConcurrentVerificationUpdateError();
    }
  }
}
