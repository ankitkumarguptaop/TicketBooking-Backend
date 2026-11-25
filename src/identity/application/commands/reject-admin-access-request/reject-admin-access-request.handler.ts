import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ADMIN_ACCESS_REQUEST_REPOSITORY,
  AdminAccessRequestRepository,
} from '../../../domain/admin-access/admin-access-request.repository';
import { AdminAccessRequestNotFoundError } from '../../../domain/errors/identity.errors';
import {
  ADMIN_ACCESS_READ_MODEL,
  AdminAccessReadModel,
  AdminAccessRequestView,
} from '../../ports/admin-access-read-model.port';
import { RejectAdminAccessRequestCommand } from './reject-admin-access-request.command';

/** Marks the request REJECTED, optionally with a note for the requester. */
@CommandHandler(RejectAdminAccessRequestCommand)
export class RejectAdminAccessRequestHandler implements ICommandHandler<
  RejectAdminAccessRequestCommand,
  AdminAccessRequestView
> {
  constructor(
    @Inject(ADMIN_ACCESS_REQUEST_REPOSITORY)
    private readonly requests: AdminAccessRequestRepository,
    @Inject(ADMIN_ACCESS_READ_MODEL)
    private readonly readModel: AdminAccessReadModel,
  ) {}

  async execute(
    command: RejectAdminAccessRequestCommand,
  ): Promise<AdminAccessRequestView> {
    const request = await this.requests.findById(command.requestId);
    if (!request) throw new AdminAccessRequestNotFoundError(command.requestId);

    request.reject(command.superAdminId, command.note, new Date());
    await this.requests.save(request);

    return (await this.readModel.findRequest(request.id))!;
  }
}
