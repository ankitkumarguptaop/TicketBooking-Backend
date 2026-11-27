import { Module } from '@nestjs/common';
import { AddMovieModule } from './features/add-movie/add-movie.module';
import { AddScreenModule } from './features/add-screen/add-screen.module';
import { AddTheatreModule } from './features/add-theatre/add-theatre.module';
import { AutoScheduleShowsModule } from './features/auto-schedule-shows/auto-schedule-shows.module';
import { CancelShowModule } from './features/cancel-show/cancel-show.module';
import { DeleteMovieModule } from './features/delete-movie/delete-movie.module';
import { DeleteScreenModule } from './features/delete-screen/delete-screen.module';
import { GetMovieModule } from './features/get-movie/get-movie.module';
import { GetScreenLayoutModule } from './features/get-screen-layout/get-screen-layout.module';
import { GetShowModule } from './features/get-show/get-show.module';
import { GetTheatreModule } from './features/get-theatre/get-theatre.module';
import { ListMoviesModule } from './features/list-movies/list-movies.module';
import { ListShowsModule } from './features/list-shows/list-shows.module';
import { ListTheatresModule } from './features/list-theatres/list-theatres.module';
import { ScheduleShowModule } from './features/schedule-show/schedule-show.module';
import { SetScreenLayoutModule } from './features/set-screen-layout/set-screen-layout.module';
import { UpdateMovieModule } from './features/update-movie/update-movie.module';
import { UpdateTheatreModule } from './features/update-theatre/update-theatre.module';
import { CatalogInfraModule } from './infra/catalog-infra.module';

/**
 * Catalog service module: movies, theatres with their screens and seat
 * layouts, and shows. Its infra plus one module per use case.
 */
@Module({
  imports: [
    CatalogInfraModule,
    // movies
    AddMovieModule,
    UpdateMovieModule,
    DeleteMovieModule,
    ListMoviesModule,
    GetMovieModule,
    // theatres, screens, seat layouts
    AddTheatreModule,
    UpdateTheatreModule,
    ListTheatresModule,
    GetTheatreModule,
    AddScreenModule,
    SetScreenLayoutModule,
    GetScreenLayoutModule,
    DeleteScreenModule,
    // shows
    ScheduleShowModule,
    AutoScheduleShowsModule,
    CancelShowModule,
    ListShowsModule,
    GetShowModule,
  ],
})
export class CatalogModule {}
