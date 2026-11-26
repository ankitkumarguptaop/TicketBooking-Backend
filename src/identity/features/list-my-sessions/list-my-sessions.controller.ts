import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../shared/infra/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { ListMySessionsQuery } from './list-my-sessions.query';
import { SessionResponseDto } from './session.response.dto';
import { SessionView } from './session.view';

@Controller('auth')
export class ListMySessionsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  listSessions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SessionResponseDto[]> {
    return this.queryBus.execute<ListMySessionsQuery, SessionView[]>(
      new ListMySessionsQuery(user.sub, user.sid),
    );
  }
}
