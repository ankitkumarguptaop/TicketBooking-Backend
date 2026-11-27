import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { Roles } from '../../../shared/infra/auth/roles.decorator';
import { RolesGuard } from '../../../shared/infra/auth/roles.guard';
import { UserRole } from '../../../shared/domain/user-role.enum';
import { TheatreView } from '../../domain/ports/theatre-read-model.port';
import { TheatreResponseDto } from '../get-theatre/theatre.response.dto';
import { AddTheatreCommand } from './add-theatre.command';
import { AddTheatreRequestDto } from './add-theatre.request.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('theatres')
export class AddTheatreController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  add(@Body() dto: AddTheatreRequestDto): Promise<TheatreResponseDto> {
    return this.commandBus.execute<AddTheatreCommand, TheatreView>(
      new AddTheatreCommand(dto.name, dto.city, dto.address),
    );
  }
}
