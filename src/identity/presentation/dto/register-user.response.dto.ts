import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  userId!: string;
}
