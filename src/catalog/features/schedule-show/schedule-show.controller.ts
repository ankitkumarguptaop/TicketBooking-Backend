import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { Roles } from '../../../shared/infra/auth/roles.decorator';
import { RolesGuard } from '../../../shared/infra/auth/roles.guard';
import { UserRole } from '../../../shared/domain/user-role.enum';
import { ShowView } from '../../domain/ports/show-read-model.port';
import { ShowResponseDto } from '../get-show/show.response.dto';
import { ScheduleShowCommand } from './schedule-show.command';
import { ScheduleShowRequestDto } from './schedule-show.request.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('shows')
export class ScheduleShowController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  schedule(@Body() dto: ScheduleShowRequestDto): Promise<ShowResponseDto> {
    return this.commandBus.execute<ScheduleShowCommand, ShowView>(
      new ScheduleShowCommand(
        dto.movieId,
        dto.screenId,
        new Date(dto.startsAt),
        dto.prices.map((p) => ({ ...p })),
      ),
    );
  }
}
