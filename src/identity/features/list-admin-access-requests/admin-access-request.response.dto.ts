import { AdminAccessRequestStatus } from '../../domain/admin-access/admin-access-request-status.enum';

export class PersonRefResponseDto {
  id!: string;
  email!: string;
  fullName!: string;
}

export class AdminAccessRequestResponseDto {
  id!: string;
  status!: AdminAccessRequestStatus;
  reason!: string;
  requestedAt!: Date;
  decidedAt!: Date | null;
  decisionNote!: string | null;
  requester!: PersonRefResponseDto;
  decidedBy!: PersonRefResponseDto | null;
}
