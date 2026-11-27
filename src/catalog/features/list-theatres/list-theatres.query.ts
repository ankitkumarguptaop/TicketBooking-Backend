import { TheatreListFilter } from '../../domain/ports/theatre-read-model.port';

export class ListTheatresQuery {
  constructor(readonly filter: TheatreListFilter) {}
}
