import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  ScreenLayoutView,
  THEATRE_READ_MODEL,
  TheatreReadModel,
} from '../../domain/ports/theatre-read-model.port';
import { GetScreenLayoutQuery } from './get-screen-layout.query';

@QueryHandler(GetScreenLayoutQuery)
export class GetScreenLayoutHandler implements IQueryHandler<
  GetScreenLayoutQuery,
  ScreenLayoutView
> {
  constructor(
    @Inject(THEATRE_READ_MODEL) private readonly readModel: TheatreReadModel,
  ) {}

  async execute(query: GetScreenLayoutQuery): Promise<ScreenLayoutView> {
    const layout = await this.readModel.findScreenLayout(query.screenId);
    // TODO(you): swap for ScreenNotFoundError once domain/errors exists.
    if (!layout)
      throw new NotFoundException(`Screen ${query.screenId} not found`);
    return layout;
  }
}
