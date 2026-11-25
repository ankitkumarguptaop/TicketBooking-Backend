import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ADMIN_ACCESS_REQUEST_REPOSITORY,
  AdminAccessRequestRepository,
} from '../../../domain/admin-access/admin-access-request.repository';
import { AdminAccessRequestNotFoundError } from '../../../domain/errors/identity.errors';
import { CancelAdminAccessRequestCommand } from './cancel-admin-access-request.command';

/** The requester withdraws their own pending request. Someone else's gets 404. */
@CommandHandler(CancelAdminAccessRequestCommand)
export class CancelAdminAccessRequestHandler implements ICommandHandler<
  CancelAdminAccessRequestCommand,
  void
> {
  constructor(
    @Inject(ADMIN_ACCESS_REQUEST_REPOSITORY)
    private readonly requests: AdminAccessRequestRepository,
  ) {}

  async execute(command: CancelAdminAccessRequestCommand): Promise<void> {
    const request = await this.requests.findById(command.requestId);
    if (!request) throw new AdminAccessRequestNotFoundError(command.requestId);

    request.cancel(command.userId, new Date());
    await this.requests.save(request);
  }
}
