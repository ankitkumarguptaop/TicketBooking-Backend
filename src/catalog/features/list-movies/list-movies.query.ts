import { MovieListFilter } from '../../domain/ports/movie-read-model.port';

export class ListMoviesQuery {
  constructor(readonly filter: MovieListFilter) {}
}
