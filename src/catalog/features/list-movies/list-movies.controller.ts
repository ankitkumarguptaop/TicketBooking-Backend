import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { MoviePage } from '../../domain/ports/movie-read-model.port';
import { ListMoviesQuery } from './list-movies.query';
import { ListMoviesQueryDto } from './list-movies.query.dto';
import { MoviePageResponseDto } from './movie-page.response.dto';

/** Public: GET /movies?search=&language=&genre=&certificate=&page=&limit= */
@Controller('movies')
export class ListMoviesController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  list(@Query() query: ListMoviesQueryDto): Promise<MoviePageResponseDto> {
    return this.queryBus.execute<ListMoviesQuery, MoviePage>(
      new ListMoviesQuery({ ...query }),
    );
  }
}
