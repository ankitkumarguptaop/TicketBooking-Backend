import { IsString, Length } from 'class-validator';

export class AddScreenRequestDto {
  /** e.g. "Audi 1"; unique within the theatre. */
  @IsString()
  @Length(1, 50)
  name!: string;
}
