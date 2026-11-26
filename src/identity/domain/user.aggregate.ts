import { AggregateRoot } from '../../shared/domain/aggregate-root';
import {
  InvalidFullNameError,
  InvalidPhoneError,
  SuperAdminRoleImmutableError,
  UserIsNotAdminError,
} from './errors/identity.errors';
import { AdminRoleGranted } from './events/admin-role-granted.event';
import { AdminRoleRevoked } from './events/admin-role-revoked.event';
import { ContactVerified } from './events/contact-verified.event';
import { PasswordChanged } from './events/password-changed.event';
import { UserRegistered } from './events/user-registered.event';
import { UserRole } from '../../shared/domain/user-role.enum';
import { Email } from './value-objects/email.vo';
import {
  ContactChannel,
  VerificationChannel,
} from './verification/verification-channel.enum';

/** Matches the varchar(100) column. */
const FULL_NAME_MAX_LENGTH = 100;
/** Optional "+", then 10-15 digits. */
const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

export interface UserProps {
  id: string;
  email: Email;
  passwordHash: string;
  fullName: string;
  /** Digits with an optional leading "+", e.g. "+919876543210". */
  phone: string;
  role: UserRole;
  createdAt: Date;
  /** null = not proven yet. A timestamp, not a boolean, so we know WHEN. */
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
}

export interface RegisterUserParams {
  id: string;
  email: Email;
  passwordHash: string;
  fullName: string;
  phone: string;
  now: Date;
}

export type CreateSuperAdminParams = RegisterUserParams;

/** Fields a user may change about themselves. Omitted = unchanged. */
export interface UserDetailsChanges {
  fullName?: string;
  phone?: string;
}

/**
 * User aggregate root (Identity context).
 * Invariants: email is unique (enforced with the repository + DB unique index),
 * new users always start with role USER, ADMIN only comes from an approved
 * admin-access request, and the one SUPER_ADMIN comes only from the seed
 * and never changes role.
 */
export class User extends AggregateRoot {
  private constructor(private props: UserProps) {
    super();
  }

  /**
   * Factory for a brand-new user.
   *  - fullName: non-empty after trim, at most 100 chars
   *  - phone: spaces/dashes/brackets stripped, then optional "+" and 10-15
   *    digits (fits the varchar(16) column)
   *  - every new user starts as USER (admins are promoted, never self-registered)
   *  - raises UserRegistered
   * Note: uniqueness of email cannot be checked here (needs the repository),
   * so the RegisterUserHandler checks it before calling this.
   */
  static register(params: RegisterUserParams): User {
    const fullName = User.validFullName(params.fullName);
    const phone = User.validPhone(params.phone);

    const user = new User({
      id: params.id,
      email: params.email,
      passwordHash: params.passwordHash,
      fullName,
      phone,
      role: UserRole.USER,
      createdAt: params.now,
      // Typing an address proves nothing; a code sent to it does.
      emailVerifiedAt: null,
      phoneVerifiedAt: null,
    });

    user.raise(new UserRegistered(user.id, user.email.value, params.now));
    return user;
  }

  /**
   * Factory for the single SUPER_ADMIN, used only by the seed script.
   *  - same field rules as register()
   *  - email counts as verified: the operator who runs the seed typed it,
   *    there is no sign-up step for this account
   *  - "only one super admin" needs the repository (and a unique index),
   *    so the seed handler checks it
   */
  static createSuperAdmin(params: CreateSuperAdminParams): User {
    const user = new User({
      id: params.id,
      email: params.email,
      passwordHash: params.passwordHash,
      fullName: User.validFullName(params.fullName),
      phone: User.validPhone(params.phone),
      role: UserRole.SUPER_ADMIN,
      createdAt: params.now,
      emailVerifiedAt: params.now,
      phoneVerifiedAt: null,
    });
    user.raise(new UserRegistered(user.id, user.email.value, params.now));
    return user;
  }

  /**
   * Makes this user an ADMIN after a super admin approved their request.
   * Idempotent: an event handler calls this, and events can arrive twice.
   * Takes effect in tokens issued from now on (next refresh or login).
   */
  grantAdminRole(now: Date): void {
    if (this.props.role === UserRole.SUPER_ADMIN) {
      throw new SuperAdminRoleImmutableError();
    }
    if (this.props.role === UserRole.ADMIN) return;
    this.props.role = UserRole.ADMIN;
    this.raise(new AdminRoleGranted(this.id, now));
  }

  /**
   * Back to USER. The handler of AdminRoleRevoked ends the user's sessions,
   * because their current access token still carries role ADMIN.
   */
  revokeAdminRole(revokedBy: string, now: Date): void {
    if (this.props.role === UserRole.SUPER_ADMIN) {
      throw new SuperAdminRoleImmutableError();
    }
    if (this.props.role !== UserRole.ADMIN) {
      throw new UserIsNotAdminError(this.id);
    }
    this.props.role = UserRole.USER;
    this.raise(new AdminRoleRevoked(this.id, revokedBy, now));
  }

  /**
   * Changes the user's own details (PATCH /users/me).
   *  - only fields that are present (not undefined) change
   *  - same rules and errors as register()
   *  - all-or-nothing: everything is validated before anything is assigned,
   *    so a bad phone never leaves a half-applied fullName behind
   *  - email and role are not changeable here
   *  - a NEW phone number is unverified again: the old proof was for the old number
   */
  updateDetails(changes: UserDetailsChanges): void {
    // 1. validate (may throw; nothing has changed yet)
    const fullName =
      changes.fullName !== undefined
        ? User.validFullName(changes.fullName)
        : this.props.fullName;
    const phone =
      changes.phone !== undefined
        ? User.validPhone(changes.phone)
        : this.props.phone;

    // 2. apply
    if (phone !== this.props.phone) this.props.phoneVerifiedAt = null;
    this.props.fullName = fullName;
    this.props.phone = phone;
  }

  /** The value a code for this channel must be sent to. */
  contactFor(channel: ContactChannel): string {
    return channel === VerificationChannel.EMAIL
      ? this.props.email.value
      : this.props.phone;
  }

  isVerified(channel: ContactChannel): boolean {
    return channel === VerificationChannel.EMAIL
      ? this.props.emailVerifiedAt !== null
      : this.props.phoneVerifiedAt !== null;
  }

  /**
   * Records that the user proved they own this contact. Idempotent: the
   * first proof's timestamp is kept and no second event is raised.
   * The caller checks the code (VerificationCode.verify) before calling this.
   */
  markVerified(channel: ContactChannel, now: Date): void {
    if (this.isVerified(channel)) return;
    if (channel === VerificationChannel.EMAIL) {
      this.props.emailVerifiedAt = now;
    } else {
      this.props.phoneVerifiedAt = now;
    }
    this.raise(new ContactVerified(this.id, channel, now));
  }

  /**
   * Replaces the password after a successful "forgot password" link.
   * The link was delivered to the user's email, so using it also proves
   * they own that email: it counts as email verification.
   * Revoking the user's sessions is the handler's job (another aggregate).
   */
  resetPassword(newPasswordHash: string, now: Date): void {
    this.props.passwordHash = newPasswordHash;
    this.raise(new PasswordChanged(this.id, now));
    this.markVerified(VerificationChannel.EMAIL, now);
  }

  /** Trimmed, 1..100 chars. Shared by register() and updateDetails(). */
  private static validFullName(raw: string): string {
    const fullName = (raw ?? '').trim();
    if (fullName.length === 0 || fullName.length > FULL_NAME_MAX_LENGTH) {
      throw new InvalidFullNameError(FULL_NAME_MAX_LENGTH);
    }
    return fullName;
  }

  /** Spaces/dashes/brackets stripped, then optional "+" and 10-15 digits. */
  private static validPhone(raw: string): string {
    const phone = (raw ?? '').replace(/[\s\-()]/g, '');
    if (!PHONE_PATTERN.test(phone)) {
      throw new InvalidPhoneError(raw);
    }
    return phone;
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
  get phone(): string {
    return this.props.phone;
  }
  get role(): UserRole {
    return this.props.role;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get emailVerifiedAt(): Date | null {
    return this.props.emailVerifiedAt;
  }
  get phoneVerifiedAt(): Date | null {
    return this.props.phoneVerifiedAt;
  }
}
