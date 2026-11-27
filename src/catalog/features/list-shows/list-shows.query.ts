import { ShowListFilter } from '../../domain/ports/show-read-model.port';

export class ListShowsQuery {
  constructor(readonly filter: ShowListFilter) {}
}
