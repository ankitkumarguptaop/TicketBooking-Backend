import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DecideAdminAccessRequestRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
