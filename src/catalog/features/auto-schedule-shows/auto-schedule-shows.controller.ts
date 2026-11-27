import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { Roles } from '../../../shared/infra/auth/roles.decorator';
import { RolesGuard } from '../../../shared/infra/auth/roles.guard';
import { UserRole } from '../../../shared/domain/user-role.enum';
import { ShowView } from '../../domain/ports/show-read-model.port';
import { ShowResponseDto } from '../get-show/show.response.dto';
import { AutoScheduleShowsCommand } from './auto-schedule-shows.command';
import { AutoScheduleShowsRequestDto } from './auto-schedule-shows.request.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('shows')
export class AutoScheduleShowsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('auto')
  autoSchedule(
    @Body() dto: AutoScheduleShowsRequestDto,
  ): Promise<ShowResponseDto[]> {
    return this.commandBus.execute<AutoScheduleShowsCommand, ShowView[]>(
      new AutoScheduleShowsCommand(
        dto.movieId,
        dto.screenId,
        dto.fromDate,
        dto.toDate,
        dto.firstShowTime,
        dto.lastShowTime,
        dto.prices.map((p) => ({ ...p })),
      ),
    );
  }
}
