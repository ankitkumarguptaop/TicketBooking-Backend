import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ScreenLayoutView } from '../../domain/ports/theatre-read-model.port';
import { GetScreenLayoutQuery } from './get-screen-layout.query';
import { ScreenLayoutResponseDto } from './screen-layout.response.dto';

/**
 * Public: the physical seat map. Availability per show comes from booking
 * (ShowSeat) later; this only says where the chairs are.
 */
@Controller('screens')
export class GetScreenLayoutController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id/layout')
  get(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ScreenLayoutResponseDto> {
    return this.queryBus.execute<GetScreenLayoutQuery, ScreenLayoutView>(
      new GetScreenLayoutQuery(id),
    );
  }
}
