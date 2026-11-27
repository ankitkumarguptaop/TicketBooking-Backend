import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  MOVIE_READ_MODEL,
  MovieReadModel,
  MovieView,
} from '../../domain/ports/movie-read-model.port';
import { GetMovieQuery } from './get-movie.query';

@QueryHandler(GetMovieQuery)
export class GetMovieHandler implements IQueryHandler<
  GetMovieQuery,
  MovieView
> {
  constructor(
    @Inject(MOVIE_READ_MODEL) private readonly readModel: MovieReadModel,
  ) {}

  async execute(query: GetMovieQuery): Promise<MovieView> {
    const movie = await this.readModel.findById(query.movieId);
    // TODO(you): swap for MovieNotFoundError once domain/errors exists,
    // so DomainErrorFilter maps it like every other domain error.
    if (!movie) throw new NotFoundException(`Movie ${query.movieId} not found`);
    return movie;
  }
}
