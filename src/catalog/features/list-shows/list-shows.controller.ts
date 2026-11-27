import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ShowPage } from '../../domain/ports/show-read-model.port';
import { ListShowsQuery } from './list-shows.query';
import { ListShowsQueryDto } from './list-shows.query.dto';
import { ShowPageResponseDto } from './show-page.response.dto';

/** Public: GET /shows?city=&date=&movieId=&theatreId=&screenId=&page=&limit= */
@Controller('shows')
export class ListShowsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  list(@Query() query: ListShowsQueryDto): Promise<ShowPageResponseDto> {
    return this.queryBus.execute<ListShowsQuery, ShowPage>(
      new ListShowsQuery({ ...query }),
    );
  }
}
