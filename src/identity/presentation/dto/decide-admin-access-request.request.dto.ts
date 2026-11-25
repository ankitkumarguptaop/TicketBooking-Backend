import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DecideAdminAccessRequestRequestDto {
  @ApiPropertyOptional({
    maxLength: 500,
    example: 'Approved for the Bengaluru venues.',
    description: 'Optional message shown to the requester',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
