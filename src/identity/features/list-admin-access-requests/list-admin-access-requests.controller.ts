import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../shared/infra/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { Roles } from '../../../shared/infra/auth/roles.decorator';
import { RolesGuard } from '../../../shared/infra/auth/roles.guard';
import { UserRole } from '../../../shared/domain/user-role.enum';
import { AdminAccessRequestView } from '../../domain/ports/admin-access-read-model.port';
import { AdminAccessRequestResponseDto } from './admin-access-request.response.dto';
import { ListAdminAccessRequestsQueryDto } from './list-admin-access-requests.query.dto';
import { ListAdminAccessRequestsQuery } from './list-admin-access-requests.query';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin-access-requests')
export class ListAdminAccessRequestsController {
  constructor(private readonly queryBus: QueryBus) {}

  /** My own requests, newest first (to show "pending" / "rejected: <note>"). */
  @Get('mine')
  mine(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AdminAccessRequestResponseDto[]> {
    return this.queryBus.execute<
      ListAdminAccessRequestsQuery,
      AdminAccessRequestView[]
    >(new ListAdminAccessRequestsQuery(undefined, user.sub));
  }

  /** The super admin's queue (?status=PENDING) or history. */
  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  list(
    @Query() query: ListAdminAccessRequestsQueryDto,
  ): Promise<AdminAccessRequestResponseDto[]> {
    return this.queryBus.execute<
      ListAdminAccessRequestsQuery,
      AdminAccessRequestView[]
    >(new ListAdminAccessRequestsQuery(query.status));
  }
}
