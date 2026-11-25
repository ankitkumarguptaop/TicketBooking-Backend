import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { AdminAccessRequestStatus } from '../../domain/admin-access/admin-access-request-status.enum';

export class ListAdminAccessRequestsQueryDto {
  @ApiPropertyOptional({
    enum: AdminAccessRequestStatus,
    description: 'Omit for all requests. PENDING is sorted oldest first.',
  })
  @IsOptional()
  @IsEnum(AdminAccessRequestStatus)
  status?: AdminAccessRequestStatus;
}
