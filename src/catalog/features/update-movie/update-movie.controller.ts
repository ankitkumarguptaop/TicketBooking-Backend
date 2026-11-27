import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { Roles } from '../../../shared/infra/auth/roles.decorator';
import { RolesGuard } from '../../../shared/infra/auth/roles.guard';
import { UserRole } from '../../../shared/domain/user-role.enum';
import { MovieView } from '../../domain/ports/movie-read-model.port';
import { MovieResponseDto } from '../get-movie/movie.response.dto';
import { UpdateMovieCommand } from './update-movie.command';
import { UpdateMovieRequestDto } from './update-movie.request.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('movies')
export class UpdateMovieController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMovieRequestDto,
  ): Promise<MovieResponseDto> {
    return this.commandBus.execute<UpdateMovieCommand, MovieView>(
      new UpdateMovieCommand(id, { ...dto }),
    );
  }
}
