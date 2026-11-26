import { Email } from '../value-objects/email.vo';
import { User } from '../user.aggregate';
import { UserRole } from '../../../shared/domain/user-role.enum';

/** Port. Implemented in infra/repository. */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  existsByEmail(email: Email): Promise<boolean>;
  existsWithRole(role: UserRole): Promise<boolean>;
  /** Saves the user and writes its pulled domain events to the outbox, in one transaction. */
  save(user: User): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
