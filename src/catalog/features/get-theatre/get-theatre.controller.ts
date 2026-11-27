import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { TheatreView } from '../../domain/ports/theatre-read-model.port';
import { GetTheatreQuery } from './get-theatre.query';
import { TheatreResponseDto } from './theatre.response.dto';

/** Public: a theatre with its screens. */
@Controller('theatres')
export class GetTheatreController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  get(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TheatreResponseDto> {
    return this.queryBus.execute<GetTheatreQuery, TheatreView>(
      new GetTheatreQuery(id),
    );
  }
}
