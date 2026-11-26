import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../../domain/user-role.enum';

/** The access token's claims, put on request.user by JwtAuthGuard. */
export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: UserRole;
  /** Session id: ties the access token to one device login. */
  sid: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();
    return request.user;
  },
);
