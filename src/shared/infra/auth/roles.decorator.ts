import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../domain/user-role.enum';

export const ROLES_KEY = 'roles';

/** Restrict a route to the given roles. Use together with JwtAuthGuard + RolesGuard. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
