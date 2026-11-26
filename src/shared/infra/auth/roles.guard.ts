import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { roleSatisfies, UserRole } from '../../domain/user-role.enum';
import { AuthenticatedUser } from './current-user.decorator';
import { ROLES_KEY } from './roles.decorator';

/**
 * Must run after JwtAuthGuard. Routes without @Roles() are allowed.
 * Roles are ranked: @Roles(ADMIN) also lets SUPER_ADMIN in.
 * With several roles listed, meeting any one of them is enough.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    if (!user || !required.some((role) => roleSatisfies(user.role, role))) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
