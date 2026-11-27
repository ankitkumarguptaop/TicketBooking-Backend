import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { Roles } from '../../../shared/infra/auth/roles.decorator';
import { RolesGuard } from '../../../shared/infra/auth/roles.guard';
import { UserRole } from '../../../shared/domain/user-role.enum';
import { MovieView } from '../../domain/ports/movie-read-model.port';
import { MovieResponseDto } from '../get-movie/movie.response.dto';
import { AddMovieCommand } from './add-movie.command';
import { AddMovieRequestDto } from './add-movie.request.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('movies')
export class AddMovieController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  add(@Body() dto: AddMovieRequestDto): Promise<MovieResponseDto> {
    return this.commandBus.execute<AddMovieCommand, MovieView>(
      new AddMovieCommand(
        dto.title,
        dto.description,
        dto.genres,
        dto.language,
        dto.runtimeMinutes,
        dto.certificate,
        dto.releaseDate,
        dto.posterUrl,
      ),
    );
  }
}
