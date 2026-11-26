import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../shared/infra/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { Roles } from '../../../shared/infra/auth/roles.decorator';
import { RolesGuard } from '../../../shared/infra/auth/roles.guard';
import { UserRole } from '../../../shared/domain/user-role.enum';
import { RevokeAdminRoleCommand } from './revoke-admin-role.command';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admins')
export class RevokeAdminRoleController {
  constructor(private readonly commandBus: CommandBus) {}

  /** ADMIN -> USER, and every session of that user ends at once. */
  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<void> {
    await this.commandBus.execute(new RevokeAdminRoleCommand(userId, user.sub));
  }
}
