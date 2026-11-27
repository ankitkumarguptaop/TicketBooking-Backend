import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelShowRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
