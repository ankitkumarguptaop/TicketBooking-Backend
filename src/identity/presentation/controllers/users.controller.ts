import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateUserDetailsCommand } from '../../application/commands/update-user-details/update-user-details.command';
import { GetUserProfileQuery } from '../../application/queries/get-user-profile/get-user-profile.query';
import { UserProfileView } from '../../application/queries/get-user-profile/user-profile.view';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../decorators/current-user.decorator';
import { UpdateUserDetailsRequestDto } from '../dto/update-user-details.request.dto';
import { UserProfileResponseDto } from '../dto/user-profile.response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('users')
@ApiCookieAuth('access_token')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('me')
  @ApiOkResponse({ type: UserProfileResponseDto })
  getMyProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserProfileResponseDto> {
    return this.queryBus.execute<GetUserProfileQuery, UserProfileView>(
      new GetUserProfileQuery(user.sub),
    );
  }

  /** Updates the signed-in user's own name and/or phone. */
  @Patch('me')
  @ApiOkResponse({ type: UserProfileResponseDto })
  updateMyDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDetailsRequestDto,
  ): Promise<UserProfileResponseDto> {
    return this.commandBus.execute<UpdateUserDetailsCommand, UserProfileView>(
      new UpdateUserDetailsCommand(user.sub, dto.fullName, dto.phone),
    );
  }
}
