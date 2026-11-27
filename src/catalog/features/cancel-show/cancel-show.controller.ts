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
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { Roles } from '../../../shared/infra/auth/roles.decorator';
import { RolesGuard } from '../../../shared/infra/auth/roles.guard';
import { UserRole } from '../../../shared/domain/user-role.enum';
import { ShowView } from '../../domain/ports/show-read-model.port';
import { ShowResponseDto } from '../get-show/show.response.dto';
import { CancelShowCommand } from './cancel-show.command';
import { CancelShowRequestDto } from './cancel-show.request.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('shows')
export class CancelShowController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CancelShowRequestDto,
  ): Promise<ShowResponseDto> {
    return this.commandBus.execute<CancelShowCommand, ShowView>(
      new CancelShowCommand(id, dto.reason),
    );
  }
}
