import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { Roles } from '../../../shared/infra/auth/roles.decorator';
import { RolesGuard } from '../../../shared/infra/auth/roles.guard';
import { UserRole } from '../../../shared/domain/user-role.enum';
import { AdminView } from '../../domain/ports/admin-access-read-model.port';
import { AdminResponseDto } from './admin.response.dto';
import { ListAdminsQuery } from './list-admins.query';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admins')
export class ListAdminsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  list(): Promise<AdminResponseDto[]> {
    return this.queryBus.execute<ListAdminsQuery, AdminView[]>(
      new ListAdminsQuery(),
    );
  }
}
