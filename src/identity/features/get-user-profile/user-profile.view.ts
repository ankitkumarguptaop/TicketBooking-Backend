import { User } from '../../domain/user.aggregate';
import { UserRole } from '../../../shared/domain/user-role.enum';

/** Flat read model returned by queries. Not a domain object. */
export interface UserProfileView {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  createdAt: Date;
  emailVerified: boolean;
  phoneVerified: boolean;
}

/** One mapping for every use case that answers with "the user" (login, me, update, verify). */
export function toUserProfileView(user: User): UserProfileView {
  return {
    id: user.id,
    email: user.email.value,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    emailVerified: user.emailVerifiedAt !== null,
    phoneVerified: user.phoneVerifiedAt !== null,
  };
}
