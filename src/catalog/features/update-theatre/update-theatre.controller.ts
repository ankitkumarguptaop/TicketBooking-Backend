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
import { TheatreView } from '../../domain/ports/theatre-read-model.port';
import { UpdateTheatreRequestDto } from '../add-theatre/add-theatre.request.dto';
import { TheatreResponseDto } from '../get-theatre/theatre.response.dto';
import { UpdateTheatreCommand } from './update-theatre.command';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('theatres')
export class UpdateTheatreController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTheatreRequestDto,
  ): Promise<TheatreResponseDto> {
    return this.commandBus.execute<UpdateTheatreCommand, TheatreView>(
      new UpdateTheatreCommand(id, { ...dto }),
    );
  }
}
