import { MovieCertificate } from '../../domain/movie-certificate.enum';

/** Fields left undefined stay as they are. Result: MovieView. */
export interface MovieChanges {
  title?: string;
  description?: string;
  genres?: string[];
  language?: string;
  runtimeMinutes?: number;
  certificate?: MovieCertificate;
  /** "YYYY-MM-DD" */
  releaseDate?: string;
  posterUrl?: string;
}

export class UpdateMovieCommand {
  constructor(
    readonly movieId: string,
    readonly changes: MovieChanges,
  ) {}
}
