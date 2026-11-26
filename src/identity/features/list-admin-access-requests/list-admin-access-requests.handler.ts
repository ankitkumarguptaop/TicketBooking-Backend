import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  ADMIN_ACCESS_READ_MODEL,
  AdminAccessReadModel,
  AdminAccessRequestView,
} from '../../domain/ports/admin-access-read-model.port';
import { ListAdminAccessRequestsQuery } from './list-admin-access-requests.query';

@QueryHandler(ListAdminAccessRequestsQuery)
export class ListAdminAccessRequestsHandler implements IQueryHandler<
  ListAdminAccessRequestsQuery,
  AdminAccessRequestView[]
> {
  constructor(
    @Inject(ADMIN_ACCESS_READ_MODEL)
    private readonly readModel: AdminAccessReadModel,
  ) {}

  execute(
    query: ListAdminAccessRequestsQuery,
  ): Promise<AdminAccessRequestView[]> {
    return this.readModel.listRequests({
      status: query.status,
      userId: query.userId,
    });
  }
}
