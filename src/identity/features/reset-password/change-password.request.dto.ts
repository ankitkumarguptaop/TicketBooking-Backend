import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordRequestDto {
  @Matches(/^[0-9]{6}$/, { message: 'code must be 6 digits' })
  code!: string;
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}
