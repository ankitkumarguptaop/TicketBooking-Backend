import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { User } from '../../../domain/user.aggregate';
import { UserRole } from '../../../domain/user-role.enum';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../domain/user.repository';
import { Email } from '../../../domain/value-objects/email.vo';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '../../ports/password-hasher.port';
import { SeedSuperAdminCommand } from './seed-super-admin.command';

export type SeedSuperAdminResult =
  { outcome: 'CREATED'; userId: string } | { outcome: 'ALREADY_EXISTS' };

/**
 * Creates THE super admin. Idempotent, so it is safe in every deploy:
 * if a super admin already exists, nothing changes (the password is NOT
 * reset). Refuses to turn an existing ordinary account into the super
 * admin, so a typo in SUPER_ADMIN_EMAIL can't hand someone full control.
 */
@CommandHandler(SeedSuperAdminCommand)
export class SeedSuperAdminHandler implements ICommandHandler<
  SeedSuperAdminCommand,
  SeedSuperAdminResult
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(command: SeedSuperAdminCommand): Promise<SeedSuperAdminResult> {
    if (await this.users.existsWithRole(UserRole.SUPER_ADMIN)) {
      return { outcome: 'ALREADY_EXISTS' };
    }

    const email = Email.create(command.email);
    if (await this.users.existsByEmail(email)) {
      throw new Error(
        `${email.value} already belongs to an ordinary account. ` +
          'Use a different SUPER_ADMIN_EMAIL; existing accounts are never promoted by the seed.',
      );
    }

    const user = User.createSuperAdmin({
      id: randomUUID(),
      email,
      passwordHash: await this.hasher.hash(command.password),
      fullName: command.fullName,
      phone: command.phone,
      now: new Date(),
    });
    await this.users.save(user);
    return { outcome: 'CREATED', userId: user.id };
  }
}
