import { Controller, MessageEvent, Sse, UseGuards } from '@nestjs/common';
import { EventBus, ofType } from '@nestjs/cqrs';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
import { ACCESS_TOKEN_COOKIE } from '../cookies/auth-cookies';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/** Comment lines keep proxies and load balancers from closing an idle stream. */
const HEARTBEAT_MS = 25_000;

/**
 * Server-Sent Events for THIS device's session. The web app keeps one open
 * while signed in, so "sign out" on another device reaches it at once
 * instead of on its next API call.
 *
 * Every revoke path (logout, revoke one, revoke others, logout-all,
 * password reset, refresh-token reuse) already publishes SessionRevoked,
 * so this only listens to the event bus.
 *
 * Limitation: the CQRS event bus is in-memory. With more than one API
 * instance, events must be fanned out (e.g. Redis pub/sub) first.
 */
@ApiTags('auth')
@Controller('auth')
export class SessionEventsController {
  constructor(private readonly eventBus: EventBus) {}

  @Sse('sessions/events')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE)
  @ApiOkResponse({
    description:
      'text/event-stream. Sends `session-revoked` once, then closes; `ping` every 25 s.',
  })
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
