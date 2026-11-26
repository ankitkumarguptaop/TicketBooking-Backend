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
import { DecideAdminAccessRequestRequestDto } from '../approve-admin-access-request/decide-admin-access-request.request.dto';
import { AdminAccessRequestResponseDto } from '../list-admin-access-requests/admin-access-request.response.dto';
import { RejectAdminAccessRequestCommand } from './reject-admin-access-request.command';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin-access-requests')
export class RejectAdminAccessRequestController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DecideAdminAccessRequestRequestDto,
  ): Promise<AdminAccessRequestResponseDto> {
    return this.commandBus.execute<
      RejectAdminAccessRequestCommand,
      AdminAccessRequestView
    >(new RejectAdminAccessRequestCommand(id, user.sub, dto.note));
  }
}
