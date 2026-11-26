import { Controller, MessageEvent, Sse, UseGuards } from '@nestjs/common';
import { EventBus, ofType } from '@nestjs/cqrs';
import {
  filter,
  interval,
  map,
  merge,
  Observable,
  take,
  takeUntil,
} from 'rxjs';
import { SessionRevoked } from '../../domain/events/session-revoked.event';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/** Comment lines keep proxies and load balancers from closing an idle stream. */
const HEARTBEAT_MS = 25_000;
@Controller('auth')
export class SessionEventsController {
  constructor(private readonly eventBus: EventBus) {}

  @Sse('sessions/events')
  @UseGuards(JwtAuthGuard)
  events(@CurrentUser() user: AuthenticatedUser): Observable<MessageEvent> {
    const revoked$ = this.eventBus.pipe(
      ofType(SessionRevoked),
      filter((event) => event.sessionId === user.sid),
      take(1),
      map((event): MessageEvent => ({
        type: 'session-revoked',
        data: { reason: event.reason },
      })),
    );
    const heartbeat$ = interval(HEARTBEAT_MS).pipe(
      map((): MessageEvent => ({ type: 'ping', data: '' })),
      takeUntil(revoked$),
    );
    // Completes right after `session-revoked`, which ends the response.
    return merge(revoked$, heartbeat$);
  }
}
