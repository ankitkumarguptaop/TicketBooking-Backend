import { User } from '../../domain/user.aggregate';
import { Email } from '../../domain/value-objects/email.vo';
import { UserOrmEntity } from './user.orm-entity';

export class UserMapper {
  static toDomain(row: UserOrmEntity): User {
    return User.rehydrate({
      id: row.id,
      email: Email.fromPersistence(row.email),
      passwordHash: row.passwordHash,
      fullName: row.fullName,
      phone: row.phone,
      role: row.role,
      createdAt: row.createdAt,
      emailVerifiedAt: row.emailVerifiedAt,
      phoneVerifiedAt: row.phoneVerifiedAt,
    });
  }

  static toPersistence(user: User): UserOrmEntity {
    const row = new UserOrmEntity();
    row.id = user.id;
    row.email = user.email.value;
    row.passwordHash = user.passwordHash;
    row.fullName = user.fullName;
    row.phone = user.phone;
    row.role = user.role;
    row.createdAt = user.createdAt;
    row.emailVerifiedAt = user.emailVerifiedAt;
    row.phoneVerifiedAt = user.phoneVerifiedAt;
    return row;
  }
}
