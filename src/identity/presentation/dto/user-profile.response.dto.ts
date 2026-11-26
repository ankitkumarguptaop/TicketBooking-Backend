import { UserRole } from '../../domain/user-role.enum';

export class UserProfileResponseDto {
  id!: string;
  email!: string;
  fullName!: string;
  phone!: string;
  role!: UserRole;
  createdAt!: Date;
  emailVerified!: boolean;
  phoneVerified!: boolean;
}
