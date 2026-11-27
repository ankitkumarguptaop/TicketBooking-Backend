import { ShowResponseDto } from '../get-show/show.response.dto';

export class ShowPageResponseDto {
  items!: ShowResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}
