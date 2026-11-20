import { Email } from './value-objects/email.vo';
import { User } from './user.aggregate';

/** Port. Implemented in infrastructure/persistence. */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  existsByEmail(email: Email): Promise<boolean>;
  save(user: User): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
