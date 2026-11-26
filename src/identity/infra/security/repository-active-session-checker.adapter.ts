import { Inject, Injectable } from '@nestjs/common';
import { ActiveSessionChecker } from '../../../shared/infra/auth/active-session-checker.port';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../domain/ports/auth-session.repository';

/** Identity's answer to JwtAuthGuard: one primary-key lookup per request. */
@Injectable()
export class RepositoryActiveSessionChecker implements ActiveSessionChecker {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly sessions: AuthSessionRepository,
  ) {}

  async isActive(
    sessionId: string,
    userId: string,
    now: Date,
  ): Promise<boolean> {
    const session = await this.sessions.findById(sessionId);
    return !!session && session.userId === userId && session.isActive(now);
  }
}
