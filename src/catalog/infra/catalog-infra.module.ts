import { Module } from '@nestjs/common';
import { MOVIE_READ_MODEL } from '../domain/ports/movie-read-model.port';
import { SHOW_READ_MODEL } from '../domain/ports/show-read-model.port';
import { THEATRE_READ_MODEL } from '../domain/ports/theatre-read-model.port';
import { TypeOrmMovieReadModel } from './repository/typeorm-movie.read-model';
import { TypeOrmShowReadModel } from './repository/typeorm-show.read-model';
import { TypeOrmTheatreReadModel } from './repository/typeorm-theatre.read-model';

/** Port tokens the feature handlers inject. */
const PORTS = [MOVIE_READ_MODEL, THEATRE_READ_MODEL, SHOW_READ_MODEL];

/**
 * Binds catalog's ports to adapters: movies, theatres/screens/seats, shows.
 * Every catalog feature module imports this; Nest builds it once.
 *
 * TODO(you): once the ports and repositories (raw SQL via DataSource) exist, bind and export
 *   MOVIE_REPOSITORY   -> TypeOrmMovieRepository
 *   THEATRE_REPOSITORY -> TypeOrmTheatreRepository
 *   SCREEN_REPOSITORY  -> TypeOrmScreenRepository
 *   SHOW_REPOSITORY    -> TypeOrmShowRepository
 * and the relay for catalog.outbox (infra/messaging/).
 */
@Module({
  providers: [
    { provide: MOVIE_READ_MODEL, useClass: TypeOrmMovieReadModel },
    { provide: THEATRE_READ_MODEL, useClass: TypeOrmTheatreReadModel },
    { provide: SHOW_READ_MODEL, useClass: TypeOrmShowReadModel },
  ],
  exports: PORTS,
})
export class CatalogInfraModule {}
