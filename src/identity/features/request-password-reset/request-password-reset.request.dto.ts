import { IsEmail, MaxLength } from 'class-validator';

export class RequestPasswordResetRequestDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;
}
