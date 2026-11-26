import { IsString, Matches } from 'class-validator';

export class ConfirmVerificationCodeRequestDto {
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'code must be 6 digits' })
  code!: string;
}
