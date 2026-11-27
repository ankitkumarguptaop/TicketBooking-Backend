import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { TheatrePage } from '../../domain/ports/theatre-read-model.port';
import { ListTheatresQuery } from './list-theatres.query';
import { ListTheatresQueryDto } from './list-theatres.query.dto';
import { TheatrePageResponseDto } from './theatre-page.response.dto';

/** Public: GET /theatres?city=&search=&page=&limit= */
@Controller('theatres')
export class ListTheatresController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  list(@Query() query: ListTheatresQueryDto): Promise<TheatrePageResponseDto> {
    return this.queryBus.execute<ListTheatresQuery, TheatrePage>(
      new ListTheatresQuery({ ...query }),
    );
  }
}
