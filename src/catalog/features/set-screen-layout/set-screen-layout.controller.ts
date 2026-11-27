import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { Roles } from '../../../shared/infra/auth/roles.decorator';
import { RolesGuard } from '../../../shared/infra/auth/roles.guard';
import { UserRole } from '../../../shared/domain/user-role.enum';
import { ScreenLayoutView } from '../../domain/ports/theatre-read-model.port';
import { ScreenLayoutResponseDto } from '../get-screen-layout/screen-layout.response.dto';
import { SetScreenLayoutCommand } from './set-screen-layout.command';
import { SetScreenLayoutRequestDto } from './set-screen-layout.request.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('screens')
export class SetScreenLayoutController {
  constructor(private readonly commandBus: CommandBus) {}

  /** PUT: the body is the complete new layout. */
  @Put(':id/layout')
  set(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetScreenLayoutRequestDto,
  ): Promise<ScreenLayoutResponseDto> {
    return this.commandBus.execute<SetScreenLayoutCommand, ScreenLayoutView>(
      new SetScreenLayoutCommand(
        id,
        dto.seats.map((s) => ({ ...s })),
      ),
    );
  }
}
