/**
 * USER        everyone who signs up
 * ADMIN       manages catalog, venues, shows; granted only when a
 *             SUPER_ADMIN approves an admin-access request
 * SUPER_ADMIN exactly one, created by the seed script; approves admins
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

/** Higher rank includes every right of a lower one. */
const RANK: Record<UserRole, number> = {
  [UserRole.USER]: 0,
  [UserRole.ADMIN]: 1,
  [UserRole.SUPER_ADMIN]: 2,
};

/** True if `role` has at least the rights of `required` (SUPER_ADMIN passes ADMIN checks). */
export function roleSatisfies(role: UserRole, required: UserRole): boolean {
  return RANK[role] >= RANK[required];
}
