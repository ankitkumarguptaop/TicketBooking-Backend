import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../shared/infra/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { UserProfileResponseDto } from '../get-user-profile/user-profile.response.dto';
import { UserProfileView } from '../get-user-profile/user-profile.view';
import { UpdateUserDetailsCommand } from './update-user-details.command';
import { UpdateUserDetailsRequestDto } from './update-user-details.request.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UpdateUserDetailsController {
  constructor(private readonly commandBus: CommandBus) {}

  /** Updates the signed-in user's own name and/or phone. */
  @Patch('me')
  updateMyDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDetailsRequestDto,
  ): Promise<UserProfileResponseDto> {
    return this.commandBus.execute<UpdateUserDetailsCommand, UserProfileView>(
      new UpdateUserDetailsCommand(user.sub, dto.fullName, dto.phone),
    );
  }
}
