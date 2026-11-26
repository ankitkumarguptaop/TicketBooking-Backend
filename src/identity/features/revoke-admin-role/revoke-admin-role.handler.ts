import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserNotFoundError } from '../../domain/errors/identity.errors';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/ports/user.repository';
import { RevokeAdminRoleCommand } from './revoke-admin-role.command';

/**
 * ADMIN -> USER. The user's sessions are ended by
 * EndSessionsOnAdminRoleRevokedHandler, so no old ADMIN token survives.
 */
@CommandHandler(RevokeAdminRoleCommand)
export class RevokeAdminRoleHandler implements ICommandHandler<
  RevokeAdminRoleCommand,
  void
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(command: RevokeAdminRoleCommand): Promise<void> {
    const user = await this.users.findById(command.userId);
    if (!user) throw new UserNotFoundError(command.userId);

    user.revokeAdminRole(command.revokedBy, new Date());
    await this.users.save(user);
  }
}
