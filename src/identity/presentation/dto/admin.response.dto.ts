import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../domain/user-role.enum';

export class AdminResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'ankit@example.com' })
  email!: string;

  @ApiProperty({ example: 'Ankit Kumar' })
  fullName!: string;

  @ApiProperty({ example: '+919876543210' })
  phone!: string;

  @ApiProperty({ enum: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
  role!: UserRole;

  @ApiProperty({
    type: Date,
    nullable: true,
    description: 'When their request was approved; null for the super admin',
  })
  adminSince!: Date | null;
}
