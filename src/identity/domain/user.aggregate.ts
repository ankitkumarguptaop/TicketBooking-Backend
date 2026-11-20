import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { UserRole } from './user-role.enum';
import { Email } from './value-objects/email.vo';

export interface UserProps {
  id: string;
  email: Email;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
}

export interface RegisterUserParams {
  id: string;
  email: Email;
  passwordHash: string;
  fullName: string;
  now: Date;
}

/**
 * User aggregate root (Identity context).
 * Invariants: email is unique (enforced with the repository + DB unique index),
 * new users always start with role USER.
 */
export class User extends AggregateRoot {
  private constructor(private props: UserProps) {
    super();
  }

  /**
   * Factory for a brand-new user.
   * TODO(you): implement.
   *  - validate fullName (non-empty after trim, sensible max length)
   *  - build the User with role = UserRole.USER and createdAt = now
   *  - raise a UserRegistered event (see events/user-registered.event.ts)
   * Note: uniqueness of email cannot be checked here (needs the repository),
   * so the RegisterUserHandler checks it before calling this.
   */
  static register(params: RegisterUserParams): User {
    void params;
    throw new Error('User.register not implemented yet');
  }

  /** Rebuilds an existing user from storage. Raises no events. */
  static rehydrate(props: UserProps): User {
    return new User({ ...props });
  }

  get id(): string {
    return this.props.id;
  }
  get email(): Email {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get fullName(): string {
    return this.props.fullName;
  }
  get role(): UserRole {
    return this.props.role;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
