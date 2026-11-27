import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { MovieView } from '../../domain/ports/movie-read-model.port';
import { GetMovieQuery } from './get-movie.query';
import { MovieResponseDto } from './movie.response.dto';

/** Public: no guard, anyone browsing can see a movie. */
@Controller('movies')
export class GetMovieController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  get(@Param('id', new ParseUUIDPipe()) id: string): Promise<MovieResponseDto> {
    return this.queryBus.execute<GetMovieQuery, MovieView>(
      new GetMovieQuery(id),
    );
  }
}
