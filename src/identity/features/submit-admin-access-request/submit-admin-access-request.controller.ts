import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../shared/infra/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { AdminAccessRequestView } from '../../domain/ports/admin-access-read-model.port';
import { AdminAccessRequestResponseDto } from '../list-admin-access-requests/admin-access-request.response.dto';
import { SubmitAdminAccessRequestCommand } from './submit-admin-access-request.command';
import { SubmitAdminAccessRequestRequestDto } from './submit-admin-access-request.request.dto';

@UseGuards(JwtAuthGuard)
@Controller('admin-access-requests')
export class SubmitAdminAccessRequestController {
  constructor(private readonly commandBus: CommandBus) {}

  /** Ask to become an admin. One pending request at a time. */
  @Post()
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitAdminAccessRequestRequestDto,
  ): Promise<AdminAccessRequestResponseDto> {
    return this.commandBus.execute<
      SubmitAdminAccessRequestCommand,
      AdminAccessRequestView
    >(new SubmitAdminAccessRequestCommand(user.sub, dto.reason));
  }
}
