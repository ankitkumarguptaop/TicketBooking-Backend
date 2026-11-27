/**
 * Removes a movie from the catalog. fk_shows_movie (RESTRICT) blocks a
 * hard delete once the movie has any show, so either refuse with a domain
 * error or make it a soft delete (archived) — your call.
 */
export class DeleteMovieCommand {
  constructor(readonly movieId: string) {}
}
