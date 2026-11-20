import { UserRole } from '../../../domain/user-role.enum';

/** Flat read model returned by queries. Not a domain object. */
export interface UserProfileView {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
}
