import { IsEnum, IsOptional } from 'class-validator';
import { AdminAccessRequestStatus } from '../../domain/admin-access/admin-access-request-status.enum';

export class ListAdminAccessRequestsQueryDto {
  @IsOptional()
  @IsEnum(AdminAccessRequestStatus)
  status?: AdminAccessRequestStatus;
}
