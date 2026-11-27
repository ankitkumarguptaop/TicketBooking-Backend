import { IsOptional, IsString, Length } from 'class-validator';

/** Shared by add (all required) and update (all optional). */
export class AddTheatreRequestDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsString()
  @Length(1, 80)
  city!: string;

  @IsString()
  @Length(1, 300)
  address!: string;
}

export class UpdateTheatreRequestDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(1, 300)
  address?: string;
}
