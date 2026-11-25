import { ApiProperty } from '@nestjs/swagger';
import { AdminAccessRequestStatus } from '../../domain/admin-access/admin-access-request-status.enum';

export class PersonRefResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'ankit@example.com' })
  email!: string;

  @ApiProperty({ example: 'Ankit Kumar' })
  fullName!: string;
}

export class AdminAccessRequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: AdminAccessRequestStatus })
  status!: AdminAccessRequestStatus;

  @ApiProperty()
  reason!: string;

  @ApiProperty()
  requestedAt!: Date;

  @ApiProperty({ type: Date, nullable: true })
  decidedAt!: Date | null;

  @ApiProperty({ type: String, nullable: true })
  decisionNote!: string | null;

  @ApiProperty({ type: PersonRefResponseDto })
  requester!: PersonRefResponseDto;

  @ApiProperty({ type: PersonRefResponseDto, nullable: true })
  decidedBy!: PersonRefResponseDto | null;
}
