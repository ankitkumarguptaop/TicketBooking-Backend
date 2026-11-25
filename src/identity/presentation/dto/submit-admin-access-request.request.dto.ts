import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SubmitAdminAccessRequestRequestDto {
  @ApiProperty({
    minLength: 10,
    maxLength: 500,
    example: 'I manage the PVR Koramangala screens and need to schedule shows.',
    description: 'Why you need admin rights; the super admin reads this',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason!: string;
}
