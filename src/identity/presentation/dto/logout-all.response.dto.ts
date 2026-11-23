import { ApiProperty } from '@nestjs/swagger';

export class LogoutAllResponseDto {
  @ApiProperty({ description: 'Number of sessions that were ended' })
  revoked!: number;
}
