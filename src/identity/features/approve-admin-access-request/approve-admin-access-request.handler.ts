import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ADMIN_ACCESS_REQUEST_REPOSITORY,
  AdminAccessRequestRepository,
} from '../../domain/ports/admin-access-request.repository';
import { AdminAccessRequestNotFoundError } from '../../domain/errors/identity.errors';
import {
  ADMIN_ACCESS_READ_MODEL,
  AdminAccessReadModel,
  AdminAccessRequestView,
} from '../../domain/ports/admin-access-read-model.port';
import { ApproveAdminAccessRequestCommand } from './approve-admin-access-request.command';

/**
 * Marks the request APPROVED. Only this aggregate changes here: the user
 * becomes ADMIN in GrantAdminRoleOnApprovalHandler, which reacts to the
 * AdminAccessApproved event (one aggregate per transaction).
 */
@CommandHandler(ApproveAdminAccessRequestCommand)
export class ApproveAdminAccessRequestHandler implements ICommandHandler<
  ApproveAdminAccessRequestCommand,
  AdminAccessRequestView
> {
  constructor(
    @Inject(ADMIN_ACCESS_REQUEST_REPOSITORY)
    private readonly requests: AdminAccessRequestRepository,
    @Inject(ADMIN_ACCESS_READ_MODEL)
    private readonly readModel: AdminAccessReadModel,
  ) {}

  async execute(
    command: ApproveAdminAccessRequestCommand,
  ): Promise<AdminAccessRequestView> {
    const request = await this.requests.findById(command.requestId);
    if (!request) throw new AdminAccessRequestNotFoundError(command.requestId);

    request.approve(command.superAdminId, command.note, new Date());
    await this.requests.save(request);

    return (await this.readModel.findRequest(request.id))!;
  }
}
