import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserNotFoundError } from '../../../domain/errors/identity.errors';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../domain/user.repository';
import { GetUserProfileQuery } from './get-user-profile.query';
import { UserProfileView } from './user-profile.view';

@QueryHandler(GetUserProfileQuery)
export class GetUserProfileHandler implements IQueryHandler<
  GetUserProfileQuery,
  UserProfileView
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(query: GetUserProfileQuery): Promise<UserProfileView> {
    const user = await this.users.findById(query.userId);
    if (!user) throw new UserNotFoundError(query.userId);

    return {
      id: user.id,
      email: user.email.value,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
