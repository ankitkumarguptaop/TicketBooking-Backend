import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
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
import { AdminAccessRequestView } from '../../domain/ports/admin-access-read-model.port';
import { DecideAdminAccessRequestRequestDto } from './decide-admin-access-request.request.dto';
import { AdminAccessRequestResponseDto } from '../list-admin-access-requests/admin-access-request.response.dto';
import { ApproveAdminAccessRequestCommand } from './approve-admin-access-request.command';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin-access-requests')
export class ApproveAdminAccessRequestController {
  constructor(private readonly commandBus: CommandBus) {}

  /**
   * Approve. The requester becomes ADMIN a moment later (event handler)
   * and sees it in tokens from their next refresh.
   */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DecideAdminAccessRequestRequestDto,
  ): Promise<AdminAccessRequestResponseDto> {
    return this.commandBus.execute<
      ApproveAdminAccessRequestCommand,
      AdminAccessRequestView
    >(new ApproveAdminAccessRequestCommand(id, user.sub, dto.note));
  }
}
