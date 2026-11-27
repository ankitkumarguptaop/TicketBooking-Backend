import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  MOVIE_READ_MODEL,
  MoviePage,
  MovieReadModel,
} from '../../domain/ports/movie-read-model.port';
import { ListMoviesQuery } from './list-movies.query';

@QueryHandler(ListMoviesQuery)
export class ListMoviesHandler implements IQueryHandler<
  ListMoviesQuery,
  MoviePage
> {
  constructor(
    @Inject(MOVIE_READ_MODEL) private readonly readModel: MovieReadModel,
  ) {}

  execute(query: ListMoviesQuery): Promise<MoviePage> {
    return this.readModel.list(query.filter);
  }
}
