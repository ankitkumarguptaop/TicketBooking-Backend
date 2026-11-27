import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  SHOW_READ_MODEL,
  ShowPage,
  ShowReadModel,
} from '../../domain/ports/show-read-model.port';
import { ListShowsQuery } from './list-shows.query';

/** F7 listing. Redis cache (invalidated on ShowScheduled/ShowCancelled) comes later. */
@QueryHandler(ListShowsQuery)
export class ListShowsHandler implements IQueryHandler<
  ListShowsQuery,
  ShowPage
> {
  constructor(
    @Inject(SHOW_READ_MODEL) private readonly readModel: ShowReadModel,
  ) {}

  execute(query: ListShowsQuery): Promise<ShowPage> {
    return this.readModel.listUpcoming(query.filter, new Date());
  }
}
