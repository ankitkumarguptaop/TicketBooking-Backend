import { MovieCertificate } from '../../domain/movie-certificate.enum';

/**
 * Only the title is required up front. language, runtime and certificate
 * may come later, but Movie must refuse to be scheduled without them.
 * Handler result: MovieView (re-read through MOVIE_READ_MODEL after save).
 */
export class AddMovieCommand {
  constructor(
    readonly title: string,
    readonly description?: string,
    readonly genres?: string[],
    readonly language?: string,
    readonly runtimeMinutes?: number,
    readonly certificate?: MovieCertificate,
    /** "YYYY-MM-DD" */
    readonly releaseDate?: string,
    readonly posterUrl?: string,
  ) {}
}
