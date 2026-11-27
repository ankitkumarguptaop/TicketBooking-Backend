import { TheatreResponseDto } from '../get-theatre/theatre.response.dto';

export class TheatrePageResponseDto {
  items!: TheatreResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}
