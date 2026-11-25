import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  ADMIN_ACCESS_READ_MODEL,
  AdminAccessReadModel,
  AdminView,
} from '../../ports/admin-access-read-model.port';
import { ListAdminsQuery } from './list-admins.query';

@QueryHandler(ListAdminsQuery)
export class ListAdminsHandler implements IQueryHandler<
  ListAdminsQuery,
  AdminView[]
> {
  constructor(
    @Inject(ADMIN_ACCESS_READ_MODEL)
    private readonly readModel: AdminAccessReadModel,
  ) {}

  execute(): Promise<AdminView[]> {
    return this.readModel.listAdmins();
  }
}
