import {
  Body,
  Controller,
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
import { ScreenLayoutView } from '../../domain/ports/theatre-read-model.port';
import { ScreenLayoutResponseDto } from '../get-screen-layout/screen-layout.response.dto';
import { AddScreenCommand } from './add-screen.command';
import { AddScreenRequestDto } from './add-screen.request.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('theatres/:theatreId/screens')
export class AddScreenController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  add(
    @Param('theatreId', new ParseUUIDPipe()) theatreId: string,
    @Body() dto: AddScreenRequestDto,
  ): Promise<ScreenLayoutResponseDto> {
    return this.commandBus.execute<AddScreenCommand, ScreenLayoutView>(
      new AddScreenCommand(theatreId, dto.name),
    );
  }
}
