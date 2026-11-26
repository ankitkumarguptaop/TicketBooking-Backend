import { UserRole } from '../../domain/user-role.enum';

export class AdminResponseDto {
  id!: string;
  email!: string;
  fullName!: string;
  phone!: string;
  role!: UserRole;
  adminSince!: Date | null;
}
