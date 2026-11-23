import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** PATCH semantics: send only the fields that change. */
export class UpdateUserDetailsRequestDto {
  @ApiPropertyOptional({ example: 'Ankit Kumar' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({
    example: '+919876543210',
    description: 'Optional "+", then 10-15 digits',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'phone must be 10-15 digits, optionally starting with +',
  })
  phone?: string;
}
