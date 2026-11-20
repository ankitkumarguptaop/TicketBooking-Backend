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
      role: row.role,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(user: User): UserOrmEntity {
    const row = new UserOrmEntity();
    row.id = user.id;
    row.email = user.email.value;
    row.passwordHash = user.passwordHash;
    row.fullName = user.fullName;
    row.role = user.role;
    row.createdAt = user.createdAt;
    return row;
  }
}
