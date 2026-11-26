import {
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
import { CancelAdminAccessRequestCommand } from './cancel-admin-access-request.command';

@UseGuards(JwtAuthGuard)
@Controller('admin-access-requests')
export class CancelAdminAccessRequestController {
  constructor(private readonly commandBus: CommandBus) {}

  /** Withdraw my pending request. */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new CancelAdminAccessRequestCommand(id, user.sub),
    );
  }
}
