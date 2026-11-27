import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ShowView } from '../../domain/ports/show-read-model.port';
import { GetShowQuery } from './get-show.query';
import { ShowResponseDto } from './show.response.dto';

/** Public. */
@Controller('shows')
export class GetShowController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  get(@Param('id', new ParseUUIDPipe()) id: string): Promise<ShowResponseDto> {
    return this.queryBus.execute<GetShowQuery, ShowView>(new GetShowQuery(id));
  }
}
