import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  TheatreView,
  THEATRE_READ_MODEL,
  TheatreReadModel,
} from '../../domain/ports/theatre-read-model.port';
import { GetTheatreQuery } from './get-theatre.query';

@QueryHandler(GetTheatreQuery)
export class GetTheatreHandler implements IQueryHandler<
  GetTheatreQuery,
  TheatreView
> {
  constructor(
    @Inject(THEATRE_READ_MODEL) private readonly readModel: TheatreReadModel,
  ) {}

  async execute(query: GetTheatreQuery): Promise<TheatreView> {
    const theatre = await this.readModel.findTheatre(query.theatreId);
    // TODO(you): swap for TheatreNotFoundError once domain/errors exists.
    if (!theatre)
      throw new NotFoundException(`Theatre ${query.theatreId} not found`);
    return theatre;
  }
}
