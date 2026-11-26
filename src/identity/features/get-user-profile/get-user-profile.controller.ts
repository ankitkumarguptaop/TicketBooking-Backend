import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../shared/infra/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { GetUserProfileQuery } from './get-user-profile.query';
import { UserProfileResponseDto } from './user-profile.response.dto';
import { UserProfileView } from './user-profile.view';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class GetUserProfileController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('me')
  getMyProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserProfileResponseDto> {
    return this.queryBus.execute<GetUserProfileQuery, UserProfileView>(
      new GetUserProfileQuery(user.sub),
    );
  }
}
