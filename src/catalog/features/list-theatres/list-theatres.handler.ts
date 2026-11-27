import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  TheatrePage,
  THEATRE_READ_MODEL,
  TheatreReadModel,
} from '../../domain/ports/theatre-read-model.port';
import { ListTheatresQuery } from './list-theatres.query';

@QueryHandler(ListTheatresQuery)
export class ListTheatresHandler implements IQueryHandler<
  ListTheatresQuery,
  TheatrePage
> {
  constructor(
    @Inject(THEATRE_READ_MODEL) private readonly readModel: TheatreReadModel,
  ) {}

  execute(query: ListTheatresQuery): Promise<TheatrePage> {
    return this.readModel.listTheatres(query.filter);
  }
}
