import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  SHOW_READ_MODEL,
  ShowReadModel,
  ShowView,
} from '../../domain/ports/show-read-model.port';
import { GetShowQuery } from './get-show.query';

@QueryHandler(GetShowQuery)
export class GetShowHandler implements IQueryHandler<GetShowQuery, ShowView> {
  constructor(
    @Inject(SHOW_READ_MODEL) private readonly readModel: ShowReadModel,
  ) {}

  async execute(query: GetShowQuery): Promise<ShowView> {
    const show = await this.readModel.findById(query.showId);
    // TODO(you): swap for ShowNotFoundError once domain/errors exists.
    if (!show) throw new NotFoundException(`Show ${query.showId} not found`);
    return show;
  }
}
