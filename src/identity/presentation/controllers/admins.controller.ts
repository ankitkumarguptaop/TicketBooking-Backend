import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RevokeAdminRoleCommand } from '../../application/commands/revoke-admin-role/revoke-admin-role.command';
import { AdminView } from '../../application/ports/admin-access-read-model.port';
import { ListAdminsQuery } from '../../application/queries/list-admins/list-admins.query';
import { UserRole } from '../../domain/user-role.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { AdminResponseDto } from '../dto/admin.response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

/** The super admin manages who is an admin. */
@ApiTags('admin-access')
@ApiCookieAuth('access_token')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admins')
export class AdminsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOkResponse({ type: [AdminResponseDto] })
  list(): Promise<AdminResponseDto[]> {
    return this.queryBus.execute<ListAdminsQuery, AdminView[]>(
      new ListAdminsQuery(),
    );
  }

  /** ADMIN -> USER, and every session of that user ends at once. */
  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<void> {
    await this.commandBus.execute(new RevokeAdminRoleCommand(userId, user.sub));
  }
}
