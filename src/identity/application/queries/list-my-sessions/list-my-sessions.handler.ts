import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../../domain/session/auth-session.repository';
import { ListMySessionsQuery } from './list-my-sessions.query';
import { SessionView } from './session.view';

@QueryHandler(ListMySessionsQuery)
export class ListMySessionsHandler implements IQueryHandler<
  ListMySessionsQuery,
  SessionView[]
> {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly sessions: AuthSessionRepository,
  ) {}

  async execute(query: ListMySessionsQuery): Promise<SessionView[]> {
    const active = await this.sessions.findActiveByUserId(
      query.userId,
      new Date(),
    );
    return active.map((s) => ({
      id: s.id,
      deviceName: s.deviceName,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      expiresAt: s.refreshTokenExpiresAt,
      current: s.id === query.currentSessionId,
    }));
  }
}
