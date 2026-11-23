import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../domain/user-role.enum';

export class UserProfileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ example: '+919876543210' })
  phone!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ description: 'Proved with a code sent to the email' })
  emailVerified!: boolean;

  @ApiProperty({ description: 'Proved with a code sent to the phone' })
  phoneVerified!: boolean;
}
