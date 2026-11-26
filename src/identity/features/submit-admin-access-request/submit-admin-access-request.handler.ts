import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { AdminAccessRequest } from '../../domain/admin-access/admin-access-request.aggregate';
import {
  ADMIN_ACCESS_REQUEST_REPOSITORY,
  AdminAccessRequestRepository,
} from '../../domain/ports/admin-access-request.repository';
import {
  AdminAccessRequestAlreadyPendingError,
  UserNotFoundError,
} from '../../domain/errors/identity.errors';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/ports/user.repository';
import {
  ADMIN_ACCESS_READ_MODEL,
  AdminAccessReadModel,
  AdminAccessRequestView,
} from '../../domain/ports/admin-access-read-model.port';
import { SubmitAdminAccessRequestCommand } from './submit-admin-access-request.command';

/** A signed-in USER asks to become ADMIN. Eligibility rules live in the aggregate. */
@CommandHandler(SubmitAdminAccessRequestCommand)
export class SubmitAdminAccessRequestHandler implements ICommandHandler<
  SubmitAdminAccessRequestCommand,
  AdminAccessRequestView
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(ADMIN_ACCESS_REQUEST_REPOSITORY)
    private readonly requests: AdminAccessRequestRepository,
    @Inject(ADMIN_ACCESS_READ_MODEL)
    private readonly readModel: AdminAccessReadModel,
  ) {}

  async execute(
    command: SubmitAdminAccessRequestCommand,
  ): Promise<AdminAccessRequestView> {
    const user = await this.users.findById(command.userId);
    if (!user) throw new UserNotFoundError(command.userId);

    // Friendly early answer; the partial unique index is the real guard.
    if (await this.requests.findPendingByUserId(user.id)) {
      throw new AdminAccessRequestAlreadyPendingError();
    }

    const request = AdminAccessRequest.submit({
      id: randomUUID(),
      requester: user,
      reason: command.reason,
      now: new Date(),
    });
    await this.requests.save(request);

    return (await this.readModel.findRequest(request.id))!;
  }
}
