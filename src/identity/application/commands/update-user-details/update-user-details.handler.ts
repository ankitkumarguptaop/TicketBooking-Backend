import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserNotFoundError } from '../../../domain/errors/identity.errors';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../domain/user.repository';
import {
  toUserProfileView,
  UserProfileView,
} from '../../queries/get-user-profile/user-profile.view';
import { UpdateUserDetailsCommand } from './update-user-details.command';

/** Load → change through the aggregate → save (events go out via the outbox). No rules here. */
@CommandHandler(UpdateUserDetailsCommand)
export class UpdateUserDetailsHandler implements ICommandHandler<
  UpdateUserDetailsCommand,
  UserProfileView
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(command: UpdateUserDetailsCommand): Promise<UserProfileView> {
    const user = await this.users.findById(command.userId);
    if (!user) throw new UserNotFoundError(command.userId);

    user.updateDetails({ fullName: command.fullName, phone: command.phone });

    await this.users.save(user);

    // Returning the new state saves the client a GET /users/me round trip.
    return toUserProfileView(user);
  }
}
